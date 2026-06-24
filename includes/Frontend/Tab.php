<?php

namespace WpAxiom\Specifico\Frontend;

if ( ! defined( 'ABSPATH' ) ) exit;

class Tab {

	function __construct() {
		add_filter( 'woocommerce_product_tabs', [ $this, 'specification_tab' ] );
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_scripts' ] );
	}

	/**
	 * Register the Specifications tab on the product page.
	 */
	function specification_tab( $tabs ) {
		global $product;

		$product_id = $product->get_id();
		$enabled    = 'yes' === get_post_meta( $product_id, '_specifico_spec', true );
		$settings   = get_option( '_specifico_settings' );

		/**
		 * Filters whether the Specifications table is shown for a product.
		 *
		 * @param bool $enabled    Whether the table is enabled (per-product meta).
		 * @param int  $product_id Product ID.
		 */
		$show = (bool) apply_filters( 'specifico_show_table', $enabled, $product_id );

		if ( $show ) {
			$default_title = is_array( $settings ) && ! empty( $settings['tab_title'] )
				? $settings['tab_title']
				: __( 'Specifications', 'specifico' );

			/**
			 * Filters the Specifications tab title.
			 *
			 * @param string      $title   Tab title.
			 * @param \WC_Product $product Product object.
			 */
			$title = apply_filters( 'specifico_tab_title', $default_title, $product );

			$tabs['specification'] = [
				'title'    => $title,
				'priority' => 10,
				'callback' => [ $this, 'specification_tab_content' ],
			];
		}

		// Optionally remove WooCommerce's default "Additional information" tab.
		$wc_mode = is_array( $settings ) && ! empty( $settings['wc_additional_info'] )
			? $settings['wc_additional_info']
			: 'keep';

		if ( 'remove' === $wc_mode || ( 'remove_if_specs' === $wc_mode && $show ) ) {
			unset( $tabs['additional_information'] );
		}

		return $tabs;
	}

	function enqueue_scripts() {
		wp_enqueue_script( 'specifico-scripts', SPECIFICO_URL . '/assets/dist/js/specifico.js', [], SPECIFICO_VERSION, true );
	}

	/**
	 * Render the specification table for the current product.
	 *
	 * Delegates to the shared Renderer so the tab and the [specifico] shortcode
	 * resolve data identically and fire the same hooks.
	 */
	function specification_tab_content() {
		Renderer::render( get_the_ID() );
	}
}
