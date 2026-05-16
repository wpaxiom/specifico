<?php

namespace WpAxiom\Specifico\Admin;

class Product_Data {

	function __construct() {
		add_action( 'add_meta_boxes', [ $this, 'specification_options' ] );
		add_action( 'save_post', [ $this, 'save_specification_options' ] );
	}

	/**
	 * Specifico Product Metabox
	 */
	public function specification_options() {
		add_meta_box( 'specifico-options', __( 'Specification Settings', 'specifico' ), [ $this, 'specifico_options_callback' ], 'product', 'normal', 'high' );
	}

	/**
	 * Mount point for the React app.
	 */
	public function specifico_options_callback() {
		?><div id="specifico-product-options"></div><?php
	}

	/**
	 * Save product specification meta.
	 *
	 * Meta keys written:
	 *   _specifico_spec     'yes' | 'no'
	 *   _specifico_override ''    | 'custom'
	 *   _specifico_groups   nested array (only when override === 'custom')
	 */
	public function save_specification_options( $product_id ) {
		if ( ! isset( $_POST['nonce'] ) ) {
			return;
		}
		if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['nonce'] ) ), 'wp_rest' ) ) {
			return;
		}

		update_post_meta( $product_id, '_specifico_spec', isset( $_POST['_specifico_spec'] ) ? 'yes' : 'no' );

		$override = isset( $_POST['_specifico_override'] ) && 'custom' === $_POST['_specifico_override']
			? 'custom'
			: '';
		update_post_meta( $product_id, '_specifico_override', $override );

		if ( 'custom' === $override && isset( $_POST['_specifico_groups'] ) && is_array( $_POST['_specifico_groups'] ) ) {
			$groups = self::sanitize_groups( wp_unslash( $_POST['_specifico_groups'] ) );
			update_post_meta( $product_id, '_specifico_groups', $groups );
			delete_post_meta( $product_id, '_specifico_inherit_values' );
		} else {
			delete_post_meta( $product_id, '_specifico_groups' );
			if ( isset( $_POST['_specifico_inherit_values'] ) && is_array( $_POST['_specifico_inherit_values'] ) ) {
				$inherit_values = self::sanitize_inherit_values( wp_unslash( $_POST['_specifico_inherit_values'] ) );
				update_post_meta( $product_id, '_specifico_inherit_values', $inherit_values );
			}
		}
	}

	/**
	 * Sanitize the nested groups payload.
	 *
	 * Expected shape:
	 *   [
	 *     [ 'id' => ..., 'title' => ..., 'inputGroups' => [ [ ['id'=>1,'value'=>...], ['id'=>2,'value'=>...] ], ... ] ],
	 *     ...
	 *   ]
	 */
	private static function sanitize_inherit_values( $raw ) {
		$clean = [];
		if ( ! is_array( $raw ) ) {
			return $clean;
		}
		foreach ( $raw as $gi => $rows ) {
			if ( ! is_array( $rows ) ) {
				continue;
			}
			foreach ( $rows as $ri => $value ) {
				$clean[ (int) $gi ][ (int) $ri ] = sanitize_text_field( (string) $value );
			}
		}
		return $clean;
	}

	private static function sanitize_groups( $raw ) {
		$clean = [];
		if ( ! is_array( $raw ) ) {
			return $clean;
		}

		foreach ( $raw as $group ) {
			if ( ! is_array( $group ) ) {
				continue;
			}

			$input_groups = [];
			if ( isset( $group['inputGroups'] ) && is_array( $group['inputGroups'] ) ) {
				foreach ( $group['inputGroups'] as $row ) {
					if ( ! is_array( $row ) ) {
						continue;
					}
					$clean_row = [];
					foreach ( $row as $field ) {
						if ( ! is_array( $field ) ) {
							continue;
						}
						$clean_row[] = [
							'id'    => isset( $field['id'] ) ? (int) $field['id'] : 0,
							'value' => isset( $field['value'] ) ? sanitize_text_field( $field['value'] ) : '',
						];
					}
					if ( ! empty( $clean_row ) ) {
						$input_groups[] = $clean_row;
					}
				}
			}

			$clean[] = [
				'id'          => isset( $group['id'] ) ? sanitize_text_field( (string) $group['id'] ) : '',
				'title'       => isset( $group['title'] ) ? sanitize_text_field( $group['title'] ) : '',
				'inputGroups' => $input_groups,
			];
		}

		return $clean;
	}
}
