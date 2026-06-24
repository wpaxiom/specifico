<?php
/**
 * Mapping Resolver.
 *
 * Resolves which specification table applies to a given WooCommerce product
 * based on the mapping rules stored in the `_specifico_mapping` option, and
 * builds the render-ready groups array for a given table.
 *
 * Shared by the REST API, the frontend product tab, and the migration script.
 *
 * @package specifico
 */

namespace WpAxiom\Specifico;

if ( ! defined( 'ABSPATH' ) ) exit;

class Mapping_Resolver {

	/**
	 * Find the specification table that should display on a product, walking
	 * the saved mapping rules in order. First match wins.
	 *
	 * @param int $product_id WooCommerce product post ID.
	 * @return array|null { table_id, table_name, match_type, match_value } or null.
	 */
	public static function resolve( $product_id ) {
		$product_id = (int) $product_id;
		$mappings   = get_option( '_specifico_mapping' );

		if ( ! is_array( $mappings ) || empty( $mappings ) ) {
			return null;
		}

		foreach ( $mappings as $mapping ) {
			$type     = $mapping['type']['value'] ?? null;
			$table_id = $mapping['category']['value'] ?? null;
			$values   = $mapping['values'] ?? [];

			if ( ! $type || ! $table_id || ! is_array( $values ) ) {
				continue;
			}

			$match = self::check_match( $product_id, $type, $values );

			if ( $match ) {
				return [
					'table_id'    => (int) $table_id,
					'table_name'  => get_the_title( $table_id ),
					'match_type'  => $type,
					'match_value' => $match['label'] ?? '',
				];
			}
		}

		return null;
	}

	/**
	 * Resolve a table and return its render-ready groups in the same shape
	 * as a per-product `_specifico_groups` array.
	 *
	 * @param int $product_id
	 * @return array Empty array if no mapping or table found.
	 */
	public static function resolve_groups( $product_id ) {
		$match = self::resolve( $product_id );
		if ( ! $match ) {
			return [];
		}

		return self::get_table_groups( $match['table_id'] );
	}

	/**
	 * Resolve the final render-ready groups for a product, honouring the
	 * per-product override model.
	 *
	 *   _specifico_override === 'custom' -> the product's own _specifico_groups
	 *   otherwise                        -> mapping result, with any per-product
	 *                                       _specifico_inherit_values merged in
	 *
	 * This is the single source of truth for "what specs does this product
	 * show" and is shared by the product tab and the [specifico] shortcode.
	 *
	 * @param int $product_id WooCommerce product post ID.
	 * @return array
	 */
	public static function resolve_product_groups( $product_id ) {
		$product_id = (int) $product_id;
		$override   = get_post_meta( $product_id, '_specifico_override', true );

		if ( 'custom' === $override ) {
			$groups = get_post_meta( $product_id, '_specifico_groups', true );
			return is_array( $groups ) ? $groups : [];
		}

		$groups         = self::resolve_groups( $product_id );
		$inherit_values = get_post_meta( $product_id, '_specifico_inherit_values', true );

		if ( is_array( $inherit_values ) && is_array( $groups ) ) {
			foreach ( $inherit_values as $gi => $rows ) {
				if ( ! is_array( $rows ) ) {
					continue;
				}
				foreach ( $rows as $ri => $value ) {
					if ( isset( $groups[ $gi ]['inputGroups'][ $ri ][1] ) ) {
						$groups[ $gi ]['inputGroups'][ $ri ][1]['value'] = $value;
					}
				}
			}
		}

		return is_array( $groups ) ? $groups : [];
	}

	/**
	 * Build the render-ready groups array for a specification table.
	 *
	 * Output shape (per group):
	 *   [
	 *     'id'          => group post ID,
	 *     'title'       => group label,
	 *     'inputGroups' => [
	 *       [ ['id' => 1, 'value' => attrName], ['id' => 2, 'value' => attrValue] ],
	 *       ...
	 *     ],
	 *   ]
	 *
	 * @param int $table_id Specifico table post ID.
	 * @return array
	 */
	public static function get_table_groups( $table_id ) {
		$data         = [];
		$table_groups = get_post_meta( $table_id, '_specifico_groups', true );

		if ( ! is_array( $table_groups ) || empty( $table_groups ) ) {
			return $data;
		}

		foreach ( $table_groups as $index => $group ) {
			$group_id = $group['value'] ?? 0;
			$attrs    = get_post_meta( $group_id, '_specifico_attr', true );

			$input_groups = [];
			if ( is_array( $attrs ) ) {
				foreach ( $attrs as $key => $attr ) {
					$input_groups[ $key ][0] = [
						'id'    => 1,
						'value' => $attr['attributeName'] ?? '',
					];
					$input_groups[ $key ][1] = [
						'id'    => 2,
						'value' => $attr['attributeValue'] ?? '',
					];
				}
			}

			$data[ $index ] = [
				'id'          => $group_id,
				'title'       => $group['label'] ?? '',
				'inputGroups' => $input_groups,
			];
		}

		return $data;
	}

	/**
	 * Internal: test whether a product matches one mapping rule's values.
	 *
	 * Preserves the original semantics of `get_product_default_attribute` but
	 * uses term-on-post lookups (1 query) instead of fetching all products in
	 * a category/tag (1 query per mapping value × all products).
	 *
	 * @param int    $product_id
	 * @param string $type   product-id | product-name | product-category | product-tag
	 * @param array  $values List of value entries from the mapping rule.
	 * @return array|null Matching value entry, or null.
	 */
	private static function check_match( $product_id, $type, $values ) {
		$cat_terms = null;
		$tag_terms = null;

		foreach ( $values as $value ) {
			$v_label = $value['label'] ?? null;
			$v_value = $value['value'] ?? null;

			if ( 'product-id' === $type && (int) $v_label === $product_id ) {
				return $value;
			}

			if ( 'product-name' === $type && (int) $v_value === $product_id ) {
				return $value;
			}

			if ( 'product-category' === $type ) {
				if ( null === $cat_terms ) {
					$cat_terms = wp_get_post_terms( $product_id, 'product_cat', [ 'fields' => 'ids' ] );
					$cat_terms = is_array( $cat_terms ) ? array_map( 'intval', $cat_terms ) : [];
				}
				if ( in_array( (int) $v_value, $cat_terms, true ) ) {
					return $value;
				}
			}

			if ( 'product-tag' === $type ) {
				if ( null === $tag_terms ) {
					$tag_terms = wp_get_post_terms( $product_id, 'product_tag', [ 'fields' => 'ids' ] );
					$tag_terms = is_array( $tag_terms ) ? array_map( 'intval', $tag_terms ) : [];
				}
				if ( in_array( (int) $v_value, $tag_terms, true ) ) {
					return $value;
				}
			}
		}

		return null;
	}
}
