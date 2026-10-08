<?php
/**
 * Specification table renderer.
 *
 * Shared render path for the product tab and the [specifico] shortcode, so both
 * resolve data identically and fire the same hooks.
 *
 * @package specifico
 */

namespace WpAxiom\Specifico\Frontend;

use WpAxiom\Specifico\Mapping_Resolver;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Renderer {

	/**
	 * Resolve, filter, and output a product's specification table.
	 *
	 * Outputs nothing when the product has no specifications.
	 *
	 * @param int $product_id WooCommerce product post ID.
	 * @return void
	 */
	public static function render( $product_id ) {
		$product_id = (int) $product_id;

		$groups = Mapping_Resolver::resolve_product_groups( $product_id );

		/**
		 * Filters the render-ready specification groups before output.
		 *
		 * Lets developers reorder, hide, or inject groups/rows programmatically.
		 *
		 * @param array $groups     Render-ready groups.
		 * @param int   $product_id Product ID.
		 */
		$groups = apply_filters( 'specifico_table_groups', $groups, $product_id );

		if ( ! is_array( $groups ) || empty( $groups ) ) {
			return;
		}

		// Product-level values per stable row key: what each cell falls back to
		// while no variation is chosen.
		$base_values = [];

		foreach ( $groups as $gi => $group ) {
			if ( ! is_array( $group ) || empty( $group['inputGroups'] ) ) {
				continue;
			}
			foreach ( $group['inputGroups'] as $ri => $row ) {
				$row_key                 = Mapping_Resolver::row_key( $row, $gi, $ri );
				$base_values[ $row_key ] = is_array( $row ) && isset( $row[1]['value'] ) ? $row[1]['value'] : '';
			}
		}

		// Show the variation the shopper lands on, not the parent's joined
		// option list, so the first paint matches the pre-selected variation.
		$variation_id = Mapping_Resolver::default_variation_id( $product_id );

		if ( $variation_id ) {
			$groups = Mapping_Resolver::apply_variation_values( $groups, $variation_id );
		}

		$settings = get_option( '_specifico_settings' );
		$style    = is_array( $settings ) && isset( $settings['styles']['value'] ) ? $settings['styles']['value'] : '';
		$show_sub = is_array( $settings ) && ! empty( $settings['enable_sub_heading'] );

		wc_get_template(
			'specification-table.php',
			[
				'groups'      => $groups,
				'base_values' => $base_values,
				'style'       => $style,
				'style_vars'  => Custom_Style::inline_vars( $style ),
				'show_sub'    => $show_sub,
				'product_id'  => $product_id,
			],
			'specifico/',
			SPECIFICO_PATH . 'templates/'
		);
	}
}
