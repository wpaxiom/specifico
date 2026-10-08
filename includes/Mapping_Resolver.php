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
		$product_id = self::parent_product_id( $product_id );
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
		$product_id = self::parent_product_id( $product_id );
		$override   = get_post_meta( $product_id, '_specifico_override', true );

		if ( 'custom' === $override ) {
			$groups = get_post_meta( $product_id, '_specifico_groups', true );
			$groups = is_array( $groups ) ? $groups : [];
		} else {
			$groups         = self::resolve_groups( $product_id );
			$groups         = is_array( $groups ) ? $groups : [];
			$inherit_values = get_post_meta( $product_id, '_specifico_inherit_values', true );

			if ( is_array( $inherit_values ) && ! empty( $groups ) ) {
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
		}

		return self::append_variation_attribute_group( $groups, $product_id );
	}

	/**
	 * Map a variation ID to its parent product ID.
	 *
	 * Variations resolve exactly like their parent: they hold none of the
	 * category/tag terms mapping rules match on, and their own post meta is
	 * not where specification data lives.
	 *
	 * @param int $product_id Product or variation post ID.
	 * @return int Parent product ID, or the original ID when it is not a variation.
	 */
	private static function parent_product_id( $product_id ) {
		$product_id = (int) $product_id;

		if ( 'product_variation' !== get_post_type( $product_id ) ) {
			return $product_id;
		}

		$parent_id = (int) wp_get_post_parent_id( $product_id );

		if ( ! $parent_id ) {
			$parent_id = (int) get_post_meta( $product_id, '_product_id', true );
		}

		return $parent_id ? $parent_id : $product_id;
	}

	/**
	 * Whether the automatic variation-attribute group is appended for variable
	 * products. Defaults on; Settings can turn it off.
	 *
	 * @return bool
	 */
	public static function variation_attribute_rows_enabled() {
		$settings = get_option( '_specifico_settings' );

		if ( ! is_array( $settings ) || ! array_key_exists( 'variable_attribute_rows', $settings ) ) {
			return true;
		}

		return (bool) $settings['variable_attribute_rows'];
	}

	/**
	 * Append one group listing every variation attribute of a variable product,
	 * so shoppers can compare option values without leaving the spec table.
	 *
	 * The group is appended last, after the positional `_specifico_inherit_values`
	 * merge, so stored per-product overrides keep their row indexes. It is
	 * marked `auto` so callers can tell it apart from stored table groups.
	 *
	 * @param array    $groups    Render-ready groups built so far.
	 * @param int      $product_id Product ID.
	 * @return array
	 */
	private static function append_variation_attribute_group( array $groups, $product_id ) {
		if ( ! self::variation_attribute_rows_enabled() || ! function_exists( 'wc_get_product' ) ) {
			return $groups;
		}

		$product = wc_get_product( $product_id );

		if ( ! $product instanceof \WC_Product || ! $product->is_type( 'variable' ) ) {
			return $groups;
		}

		$rows = self::variation_attribute_rows( $product );

		if ( empty( $rows ) ) {
			return $groups;
		}

		$groups[] = [
			'id'          => '',
			'title'       => __( 'Variation attributes', 'specifico' ),
			'auto'        => true,
			'inputGroups' => $rows,
		];

		return $groups;
	}

	/**
	 * Build one row per variation attribute: attribute label plus the option
	 * values it can take, in the order the merchant configured them.
	 *
	 * @param \WC_Product_Variable $product Variable product.
	 * @return array Render-ready rows.
	 */
	private static function variation_attribute_rows( \WC_Product_Variable $product ) {
		$rows       = [];
		$attributes = $product->get_attributes();

		foreach ( $product->get_variation_attributes() as $name => $values ) {
			$values    = array_values( array_filter( array_map( 'strval', (array) $values ), 'strlen' ) );
			$attribute = $attributes[ $name ] ?? null;
			$labels    = [];

			if ( taxonomy_exists( $name ) ) {
				$known = [];

				if ( $attribute instanceof \WC_Product_Attribute ) {
					foreach ( $attribute->get_options() as $option ) {
						$term = get_term( (int) $option, $name );

						if ( $term && ! is_wp_error( $term ) ) {
							$known[ $term->slug ] = $term->name;
						}
					}
				}

				foreach ( $values as $slug ) {
					if ( isset( $known[ $slug ] ) ) {
						$labels[] = $known[ $slug ];
						continue;
					}

					$term = get_term_by( 'slug', $slug, $name );

					if ( $term && ! is_wp_error( $term ) ) {
						$labels[] = $term->name;
					} else {
						$labels[] = $slug;
					}
				}
			} else {
				// Custom (non-taxonomy) attributes store their display values.
				$labels = $values;
			}

			$labels = array_values( array_unique( $labels ) );

			if ( empty( $labels ) ) {
				continue;
			}

			$rows[] = [
				0 => [
					'id'    => 1,
					'key'   => 'variation-attribute-' . sanitize_key( $name ),
					'value' => wc_attribute_label( $name, $product ),
				],
				1 => [
					'id'    => 2,
					'value' => implode( ', ', $labels ),
				],
				// Which attribute this row reports on, so a selected variation
				// can replace the joined option list with its own value.
				'attribute' => $name,
			];
		}

		return $rows;
	}

	/**
	 * Swap a rendered group array over to one variation's values.
	 *
	 * Two sources feed the swap: stored per-variation deltas
	 * (`_specifico_var_values[variation][row_key]` on the parent), and the
	 * automatic attribute rows, whose parent value is the joined option list
	 * and whose variation value is the single option selected.
	 *
	 * @param array $groups       Render-ready groups (parent level).
	 * @param int   $variation_id Variation post ID.
	 * @return array
	 */
	public static function apply_variation_values( array $groups, $variation_id ) {
		$variation_id = (int) $variation_id;

		if ( ! function_exists( 'wc_get_product' ) ) {
			return $groups;
		}

		$variation = wc_get_product( $variation_id );

		if ( ! $variation instanceof \WC_Product_Variation ) {
			return $groups;
		}

		$stored = get_post_meta( $variation->get_parent_id(), '_specifico_var_values', true );
		$stored = is_array( $stored ) && isset( $stored[ $variation_id ] ) && is_array( $stored[ $variation_id ] )
			? $stored[ $variation_id ]
			: [];

		foreach ( $groups as $gi => $group ) {
			foreach ( (array) ( $group['inputGroups'] ?? [] ) as $ri => $row ) {
				$row_key = self::row_key( $row, $gi, $ri );
				$value   = null;

				if ( array_key_exists( $row_key, $stored ) && ! is_array( $stored[ $row_key ] ) ) {
					$value = $stored[ $row_key ];
				} elseif ( array_key_exists( 'position-' . $gi . '-' . $ri, $stored ) && ! is_array( $stored[ 'position-' . $gi . '-' . $ri ] ) ) {
					$value = $stored[ 'position-' . $gi . '-' . $ri ];
				} elseif ( isset( $stored[ $gi ] ) && is_array( $stored[ $gi ] ) && array_key_exists( $ri, $stored[ $gi ] ) ) {
					// Backward compatibility with the unfinished positional 1.0.8 draft.
					$value = $stored[ $gi ][ $ri ];
				}

				if ( null !== $value && isset( $groups[ $gi ]['inputGroups'][ $ri ][1] ) ) {
					$groups[ $gi ]['inputGroups'][ $ri ][1]['value'] = $value;
				}
			}
		}

		foreach ( $groups as $gi => $group ) {
			if ( empty( $group['auto'] ) || empty( $group['inputGroups'] ) ) {
				continue;
			}
			foreach ( $group['inputGroups'] as $ri => $row ) {
				$name = $row['attribute'] ?? '';
				if ( '' === $name ) {
					continue;
				}
				$value = self::variation_attribute_value( $variation, $name );
				if ( '' !== $value && isset( $groups[ $gi ]['inputGroups'][ $ri ][1] ) ) {
					$groups[ $gi ]['inputGroups'][ $ri ][1]['value'] = $value;
				}
			}
		}

		return $groups;
	}

	/**
	 * Display value of one attribute for one variation.
	 *
	 * @param \WC_Product_Variation $variation      Variation.
	 * @param string                $attribute_name Taxonomy or custom attribute name.
	 * @return string Empty string when the variation leaves the attribute open.
	 */
	private static function variation_attribute_value( \WC_Product_Variation $variation, $attribute_name ) {
		$raw = (string) $variation->get_attribute( $attribute_name );

		if ( '' === $raw ) {
			return '';
		}

		if ( ! taxonomy_exists( $attribute_name ) ) {
			return $raw;
		}

		$term = get_term_by( 'slug', $raw, $attribute_name );

		return ( $term && ! is_wp_error( $term ) ) ? $term->name : $raw;
	}

	/**
	 * The variation a variable product starts on: the one matching its saved
	 * default attributes. When WooCommerce has no complete default selection,
	 * return zero so the table keeps showing the parent product values.
	 *
	 * @param int $product_id Product ID.
	 * @return int Variation ID, or 0 when the product has no variations.
	 */
	public static function default_variation_id( $product_id ) {
		if ( ! function_exists( 'wc_get_product' ) ) {
			return 0;
		}

		$product = wc_get_product( (int) $product_id );

		if ( ! $product instanceof \WC_Product || ! $product->is_type( 'variable' ) ) {
			return 0;
		}

		$defaults = $product->get_default_attributes();

		// A partial default does not select a variation in WooCommerce, so it
		// must not select one in the specification table either.
		$variation_attributes = array_keys( $product->get_variation_attributes() );
		if ( empty( $defaults ) || array_diff( $variation_attributes, array_keys( $defaults ) ) ) {
			return 0;
		}

		foreach ( $product->get_children() as $child_id ) {
				$variation = wc_get_product( $child_id );

				if ( ! $variation instanceof \WC_Product_Variation ) {
					continue;
				}

				$matches = true;

				foreach ( $defaults as $attribute => $slug ) {
					if ( $variation->get_attribute( $attribute ) !== $slug ) {
						$matches = false;
						break;
					}
				}

				if ( $matches && $variation->variation_is_active() ) {
					return (int) $child_id;
				}
		}

		return 0;
	}

	/**
	 * Stable identifier for one rendered specification row.
	 *
	 * New rows carry a persistent key on their label cell. The positional
	 * fallback keeps third-party filtered rows and pre-1.0.8 draft data working.
	 *
	 * @param array $row Row data.
	 * @param int   $group_index Group position.
	 * @param int   $row_index Row position.
	 * @return string
	 */
	public static function row_key( $row, $group_index, $row_index ) {
		if ( is_array( $row ) && ! empty( $row[0]['key'] ) ) {
			return sanitize_key( (string) $row[0]['key'] );
		}

		return 'position-' . (int) $group_index . '-' . (int) $row_index;
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
					$row_key = ! empty( $attr['id'] )
						? sanitize_key( (string) $attr['id'] )
						: 'group-' . (int) $group_id . '-row-' . (int) $key;
					$input_groups[ $key ][0] = [
						'id'    => 1,
						'key'   => $row_key,
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
