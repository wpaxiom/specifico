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

		$settings = get_option( '_specifico_settings' );
		$style    = is_array( $settings ) && isset( $settings['styles']['value'] ) ? $settings['styles']['value'] : '';
		$show_sub = is_array( $settings ) && ! empty( $settings['enable_sub_heading'] );

		wc_get_template(
			'specification-table.php',
			[
				'groups'     => $groups,
				'style'      => $style,
				'show_sub'   => $show_sub,
				'product_id' => $product_id,
			],
			'specifico/',
			SPECIFICO_PATH . 'templates/'
		);
	}
}
