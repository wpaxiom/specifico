<?php
/**
 * [specifico] shortcode.
 *
 * Renders a product's specification table anywhere — outside the product tab,
 * in the block editor (via a Shortcode block), page builders, etc. Reuses the
 * shared Renderer, so the same data resolution and hooks apply.
 *
 * Usage:
 *   [specifico]            Renders the current product's table.
 *   [specifico id="123"]   Renders product 123's table.
 *
 * @package specifico
 */

namespace WpAxiom\Specifico\Frontend;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Shortcode {

	/**
	 * Shortcode constructor.
	 */
	public function __construct() {
		add_shortcode( 'specifico', [ $this, 'render_shortcode' ] );
	}

	/**
	 * Render the [specifico] shortcode.
	 *
	 * @param array|string $atts Shortcode attributes.
	 * @return string Specification table HTML, or empty string.
	 */
	public function render_shortcode( $atts ) {
		$atts = shortcode_atts(
			[
				'id' => 0,
			],
			$atts,
			'specifico'
		);

		$product_id = (int) $atts['id'];

		if ( ! $product_id ) {
			global $product;
			if ( $product instanceof \WC_Product ) {
				$product_id = $product->get_id();
			} else {
				$product_id = (int) get_the_ID();
			}
		}

		if ( ! $product_id ) {
			return '';
		}

		ob_start();
		Renderer::render( $product_id );
		return ob_get_clean();
	}
}
