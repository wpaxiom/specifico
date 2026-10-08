<?php

namespace WpAxiom\Specifico\Admin;

if ( ! defined( 'ABSPATH' ) ) exit;

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
		?><div id="specifico-product-options" class="specifico-app"></div><?php
	}

	/**
	 * Save product specification meta.
	 *
	 * Meta keys written:
	 *   _specifico_spec       'yes' | 'no'
	 *   _specifico_override   ''    | 'custom'
	 *   _specifico_groups     nested array (only when override === 'custom')
	 *   _specifico_var_values [variation][stable_row_key] => value (deltas only;
	 *                         a row left out of the payload inherits)
	 */
	public function save_specification_options( $product_id ) {
		if ( wp_is_post_autosave( $product_id ) || wp_is_post_revision( $product_id ) ) {
			return;
		}

		if ( 'product' !== get_post_type( $product_id ) || ! current_user_can( 'edit_post', $product_id ) ) {
			return;
		}

		if ( ! isset( $_POST['nonce'] ) ) {
			return;
		}
		if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['nonce'] ) ), 'wp_rest' ) ) {
			return;
		}

		$spec_enabled = isset( $_POST['_specifico_spec'] );
		update_post_meta( $product_id, '_specifico_spec', $spec_enabled ? 'yes' : 'no' );

		$override = isset( $_POST['_specifico_override'] ) && 'custom' === $_POST['_specifico_override']
			? 'custom'
			: '';
		update_post_meta( $product_id, '_specifico_override', $override );

		if ( 'custom' === $override && isset( $_POST['_specifico_groups'] ) && is_array( $_POST['_specifico_groups'] ) ) {
			$groups = self::sanitize_groups( map_deep( wp_unslash( $_POST['_specifico_groups'] ), 'sanitize_text_field' ) );
			update_post_meta( $product_id, '_specifico_groups', $groups );
			delete_post_meta( $product_id, '_specifico_inherit_values' );
		} else {
			delete_post_meta( $product_id, '_specifico_groups' );
			if ( isset( $_POST['_specifico_inherit_values'] ) && is_array( $_POST['_specifico_inherit_values'] ) ) {
				$inherit_values = self::sanitize_inherit_values( map_deep( wp_unslash( $_POST['_specifico_inherit_values'] ), 'sanitize_text_field' ) );
				update_post_meta( $product_id, '_specifico_inherit_values', $inherit_values );
			}
		}

		// Per-variation values apply in either override mode. The payload holds
		// only the rows the merchant filled in, so an omitted row (or a cleared
		// field) goes back to inheriting the product's own value.
		if ( ! $spec_enabled ) {
			delete_post_meta( $product_id, '_specifico_var_values' );
		} elseif ( isset( $_POST['_specifico_var_values_present'] ) ) {
			$raw_var_values = isset( $_POST['_specifico_var_values'] ) && is_array( $_POST['_specifico_var_values'] )
				? map_deep( wp_unslash( $_POST['_specifico_var_values'] ), 'sanitize_text_field' )
				: [];
			$var_values = self::sanitize_var_values(
				$raw_var_values,
				$product_id
			);

			if ( ! empty( $var_values ) ) {
				update_post_meta( $product_id, '_specifico_var_values', $var_values );
			} else {
				delete_post_meta( $product_id, '_specifico_var_values' );
			}
		} elseif ( function_exists( 'wc_get_product' ) ) {
			$product = wc_get_product( $product_id );
			if ( ! $product instanceof \WC_Product || ! $product->is_type( 'variable' ) ) {
				delete_post_meta( $product_id, '_specifico_var_values' );
			}
		}
	}

	/**
	 * Sanitize the per-product value overrides for inherit mode.
	 *
	 * Shape: [ group_index ][ row_index ] => value.
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

	/**
	 * Sanitize the per-variation value deltas.
	 *
	 * Shape: [ variation_id ][ stable_row_key ] => value. A row that
	 * is empty, or a variation that does not belong to this product, is dropped
	 * so it inherits instead.
	 *
	 * @param array $raw        Unslashed payload from the metabox.
	 * @param int   $product_id Parent product ID.
	 * @return array
	 */
	private static function sanitize_var_values( $raw, $product_id ) {
		$clean = [];

		if ( ! is_array( $raw ) ) {
			return $clean;
		}

		if ( ! function_exists( 'wc_get_product' ) ) {
			return $clean;
		}

		$product = wc_get_product( (int) $product_id );

		if ( ! $product instanceof \WC_Product || ! $product->is_type( 'variable' ) ) {
			return $clean;
		}

		$children = array_map( 'intval', $product->get_children() );
		$groups   = \WpAxiom\Specifico\Mapping_Resolver::resolve_product_groups( $product_id );
		$allowed  = [];

		foreach ( $groups as $gi => $group ) {
			if ( ! empty( $group['auto'] ) ) {
				continue;
			}
			foreach ( (array) ( $group['inputGroups'] ?? [] ) as $ri => $row ) {
				$allowed[ \WpAxiom\Specifico\Mapping_Resolver::row_key( $row, $gi, $ri ) ] = true;
			}
		}

		foreach ( $raw as $variation_id => $rows ) {
			$variation_id = (int) $variation_id;

			if ( ! in_array( $variation_id, $children, true ) || ! is_array( $rows ) ) {
				continue;
			}

			foreach ( $rows as $row_key => $value ) {
				$row_key = sanitize_key( (string) $row_key );
				$value   = sanitize_text_field( is_scalar( $value ) ? (string) $value : '' );

				if ( '' === $value || ! isset( $allowed[ $row_key ] ) ) {
					continue;
				}

				$clean[ $variation_id ][ $row_key ] = $value;
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
					foreach ( $row as $field_index => $field ) {
						if ( ! is_array( $field ) ) {
							continue;
						}
						$clean_field = [
							'id'    => isset( $field['id'] ) ? (int) $field['id'] : 0,
							'value' => isset( $field['value'] ) ? sanitize_text_field( $field['value'] ) : '',
						];
						if ( 0 === (int) $field_index ) {
							$clean_field['key'] = ! empty( $field['key'] )
								? sanitize_key( (string) $field['key'] )
								: sanitize_key( 'row-' . wp_generate_uuid4() );
						}
						$clean_row[] = $clean_field;
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
