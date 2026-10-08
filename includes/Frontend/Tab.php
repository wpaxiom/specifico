<?php

namespace WpAxiom\Specifico\Frontend;

use WpAxiom\Specifico\Mapping_Resolver;

if ( ! defined( 'ABSPATH' ) ) exit;

class Tab {

	/**
	 * Parent-level groups per product for the current request, so attaching
	 * spec deltas does not re-resolve them once per variation.
	 *
	 * @var array
	 */
	private static $group_cache = [];

	function __construct() {
		add_filter( 'woocommerce_product_tabs', [ $this, 'specification_tab' ] );
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_scripts' ] );
		add_filter( 'woocommerce_available_variation', [ $this, 'attach_variation_specs' ], 10, 3 );
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
		// Version by file mtime so a rebuilt bundle busts the browser cache even
		// between plugin releases (the CSS is injected by this JS bundle).
		$path = SPECIFICO_PATH . 'assets/dist/js/specifico.js';
		$ver  = file_exists( $path ) ? (string) filemtime( $path ) : SPECIFICO_VERSION;
		// jQuery is required: WooCommerce announces the chosen variation through
		// jQuery-only events (found_variation, reset_data), which no native
		// listener can hear.
		wp_enqueue_script( 'specifico-scripts', SPECIFICO_URL . '/assets/dist/js/specifico.js', [ 'jquery' ], $ver, true );
	}

	/**
	 * Attach the specification rows that differ for a variation to its
	 * `woocommerce_available_variation` payload, keyed by stable row ID.
	 *
	 * The variations JSON already ships to the browser on page load, so the
	 * shopper's selection swaps cells without another request.
	 *
	 * @param array             $data      Variation payload.
	 * @param \WC_Product       $product   Parent product.
	 * @param \WC_Product_Variation $variation Variation being described.
	 * @return array
	 */
	function attach_variation_specs( $data, $product, $variation ) {
		if ( ! is_array( $data ) || ! $variation instanceof \WC_Product_Variation ) {
			return $data;
		}

		$parent_id = $product instanceof \WC_Product ? $product->get_id() : $variation->get_parent_id();

		if ( ! isset( self::$group_cache[ $parent_id ] ) ) {
			self::$group_cache[ $parent_id ] = Mapping_Resolver::resolve_product_groups( $parent_id );
		}

		$parent_groups = self::$group_cache[ $parent_id ];

		if ( empty( $parent_groups ) ) {
			return $data;
		}

		$variation_groups = Mapping_Resolver::apply_variation_values( $parent_groups, $variation->get_id() );
		$deltas           = [];

		foreach ( $variation_groups as $gi => $group ) {
			foreach ( ( $group['inputGroups'] ?? [] ) as $ri => $row ) {
				$value  = $row[1]['value'] ?? '';
				$parent = $parent_groups[ $gi ]['inputGroups'][ $ri ][1]['value'] ?? null;

				if ( null !== $parent && $value !== $parent ) {
					$deltas[ Mapping_Resolver::row_key( $row, $gi, $ri ) ] = $value;
				}
			}
		}

		if ( ! empty( $deltas ) ) {
			$data['specifico'] = $deltas;
		}

		return $data;
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
