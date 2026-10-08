<?php
/**
 * Schema.org structured data.
 *
 * Enriches WooCommerce's existing `Product` JSON-LD with the product's resolved
 * specifications as `additionalProperty` (PropertyValue) entries. Merging into
 * WooCommerce's node — rather than emitting a second <script> — keeps a single
 * Product entity per page, which search engines expect.
 *
 * @package specifico
 */

namespace WpAxiom\Specifico\Frontend;

use WpAxiom\Specifico\Mapping_Resolver;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Structured_Data {

	/**
	 * Structured_Data constructor.
	 */
	public function __construct() {
		add_filter( 'woocommerce_structured_data_product', [ $this, 'add_specifications' ], 10, 2 );
	}

	/**
	 * Append specification rows to the product's structured data markup.
	 *
	 * Gated on the same conditions as the visible Specifications tab, because
	 * structured data must reflect content that is actually shown on the page.
	 *
	 * @param array       $markup  WooCommerce Product structured data.
	 * @param \WC_Product $product Product object.
	 * @return array
	 */
	public function add_specifications( $markup, $product ) {
		if ( ! is_array( $markup ) || ! $product instanceof \WC_Product ) {
			return $markup;
		}

		$product_id = $product->get_id();
		$enabled    = 'yes' === get_post_meta( $product_id, '_specifico_spec', true );

		/** This filter is documented in includes/Frontend/Tab.php */
		if ( ! apply_filters( 'specifico_show_table', $enabled, $product_id ) ) {
			return $markup;
		}

		$groups = Mapping_Resolver::resolve_product_groups( $product_id );

		/** This filter is documented in includes/Frontend/Renderer.php */
		$groups = apply_filters( 'specifico_table_groups', $groups, $product_id );

		if ( ! is_array( $groups ) || empty( $groups ) ) {
			return $markup;
		}

		$properties = [];
		$varying    = self::varying_row_keys( $product_id, $groups );

		foreach ( $groups as $gi => $group ) {
			if ( empty( $group['inputGroups'] ) || ! is_array( $group['inputGroups'] ) ) {
				continue;
			}

			// Rows the shopper can change by picking a variation, and rows
			// derived from the attributes themselves, describe one variant, not
			// the product, so they stay out of the parent's structured data.
			$auto = ! empty( $group['auto'] );

			foreach ( $group['inputGroups'] as $ri => $row ) {
				$name  = isset( $row[0]['value'] ) ? trim( wp_strip_all_tags( $row[0]['value'] ) ) : '';
				$value = isset( $row[1]['value'] ) ? trim( wp_strip_all_tags( $row[1]['value'] ) ) : '';

				if ( '' === $name || '' === $value ) {
					continue;
				}

				if ( $auto || isset( $varying[ Mapping_Resolver::row_key( $row, $gi, $ri ) ] ) ) {
					continue;
				}

				$properties[] = [
					'@type' => 'PropertyValue',
					'name'  => $name,
					'value' => $value,
				];
			}
		}

		if ( empty( $properties ) ) {
			return $markup;
		}

		/**
		 * Filters the specification PropertyValue entries added to the product's
		 * structured data. Return an empty array to omit the structured data.
		 *
		 * @param array $properties List of Schema.org PropertyValue entries.
		 * @param int   $product_id Product ID.
		 */
		$properties = apply_filters( 'specifico_structured_data', $properties, $product_id );

		if ( ! is_array( $properties ) || empty( $properties ) ) {
			return $markup;
		}

		$existing = isset( $markup['additionalProperty'] ) && is_array( $markup['additionalProperty'] )
			? $markup['additionalProperty']
			: [];

		$markup['additionalProperty'] = array_merge( $existing, $properties );

		return $markup;
	}

	/**
	 * Stable row keys whose value differs for at least one variation.
	 *
	 * @param int   $product_id Product ID.
	 * @param array $groups     Product-level (base) groups.
	 * @return array Set of stable row keys.
	 */
	private static function varying_row_keys( $product_id, $groups ) {
		if ( ! function_exists( 'wc_get_product' ) ) {
			return [];
		}

		$product = wc_get_product( (int) $product_id );

		if ( ! $product instanceof \WC_Product || ! $product->is_type( 'variable' ) ) {
			return [];
		}

		$keys = [];

		foreach ( $product->get_children() as $variation_id ) {
			$variation_groups = Mapping_Resolver::apply_variation_values( $groups, (int) $variation_id );

			foreach ( $variation_groups as $gi => $group ) {
				if ( empty( $group['inputGroups'] ) || ! is_array( $group['inputGroups'] ) ) {
					continue;
				}

				foreach ( $group['inputGroups'] as $ri => $row ) {
					$base    = $groups[ $gi ]['inputGroups'][ $ri ][1]['value'] ?? null;
					$current = is_array( $row ) && isset( $row[1]['value'] ) ? $row[1]['value'] : null;

					if ( $current !== $base ) {
						$keys[ Mapping_Resolver::row_key( $row, $gi, $ri ) ] = true;
					}
				}
			}
		}

		return $keys;
	}
}
