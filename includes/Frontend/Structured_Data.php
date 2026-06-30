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

		foreach ( $groups as $group ) {
			if ( empty( $group['inputGroups'] ) || ! is_array( $group['inputGroups'] ) ) {
				continue;
			}

			foreach ( $group['inputGroups'] as $row ) {
				$name  = isset( $row[0]['value'] ) ? trim( wp_strip_all_tags( $row[0]['value'] ) ) : '';
				$value = isset( $row[1]['value'] ) ? trim( wp_strip_all_tags( $row[1]['value'] ) ) : '';

				if ( '' === $name || '' === $value ) {
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
}
