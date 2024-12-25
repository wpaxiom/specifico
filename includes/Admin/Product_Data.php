<?php

namespace WpAxiom\Specifico\Admin;

class Product_Data {
	/**
	 * Product_Data constructor.
	 */

	function __construct() {
		add_action( 'add_meta_boxes', [ $this, 'specification_options' ] );
		add_action( 'save_post', [ $this, 'save_specification_options' ] );
	}

	/**
	 * Specifico Product Metabox
	 *
	 * @return void
	 */
	public function specification_options() {
		add_meta_box( 'specifico-options', __( 'Specification Settings', 'specifico' ), [ $this, 'specifico_options_callback' ], 'product', 'normal', 'high' );
	}

	/**
	 * Specifico Options Callback
	 *
	 * @return void
	 */
	public function specifico_options_callback() {
		?><div id="specifico-product-options"></div><?php
	}

	/**
	 * Save Product meta
	 *
	 * @param $product_id
	 *
	 * @return void
	 */
	public function save_specification_options( $product_id ) {
		if ( isset( $_POST['nonce'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['nonce'] ) ), 'wp_rest' ) ) {
			update_post_meta( $product_id, '_specifico_spec', isset( $_POST['_specifico_spec'] ) ? 'yes' : 'no' );

			$specifico_keys = [
				'_specifico_type',
				'_specifico_table',
				'_specifico_groups',
			];

			foreach ( $specifico_keys as $specifico_key ) {
				if ( isset( $_POST[ $specifico_key ] ) && ! empty( $_POST[ $specifico_key ] ) ) {
					$specifico_value = sanitize_text_field( wp_unslash( $_POST[ $specifico_key ] ) );
					if ( $specifico_value ) {
						update_post_meta( $product_id, $specifico_key, $specifico_value );
					}
				}
			}
		}
	}
}
