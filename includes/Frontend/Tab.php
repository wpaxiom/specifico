<?php

namespace WpAxiom\Specifico\Frontend;

use WpAxiom\Specifico\Mapping_Resolver;

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

		$enabled = get_post_meta( $product->get_id(), '_specifico_spec', true );
		if ( 'yes' === $enabled ) {
			$tabs['specification'] = [
				'title'    => __( 'Specifications', 'specifico' ),
				'priority' => 10,
				'callback' => [ $this, 'specification_tab_content' ],
			];
		}

		return $tabs;
	}

	function enqueue_scripts() {
		wp_enqueue_script( 'specifico-scripts', SPECIFICO_URL . '/assets/dist/js/specifico.js', [], SPECIFICO_VERSION, true );
	}

	/**
	 * Render the specification table.
	 *
	 * Source of truth:
	 *   _specifico_override === 'custom'  -> render _specifico_groups
	 *   otherwise                         -> resolve via mapping rules
	 */
	function specification_tab_content() {
		$product_id = get_the_ID();
		$override   = get_post_meta( $product_id, '_specifico_override', true );

		if ( 'custom' === $override ) {
			$groups = get_post_meta( $product_id, '_specifico_groups', true );
		} else {
			$groups         = Mapping_Resolver::resolve_groups( $product_id );
			$inherit_values = get_post_meta( $product_id, '_specifico_inherit_values', true );
			if ( is_array( $inherit_values ) && is_array( $groups ) ) {
				foreach ( $inherit_values as $gi => $rows ) {
					if ( ! is_array( $rows ) ) {
						continue;
					}
					foreach ( $rows as $ri => $value ) {
						if ( isset( $groups[ $gi ]['inputGroups'][ $ri ][1] ) ) {
							$groups[ $gi ]['inputGroups'][ $ri ][1]['value'] = $value;
						}
					}
				}
			}
		}

		if ( ! is_array( $groups ) || empty( $groups ) ) {
			return;
		}

		$settings = get_option( '_specifico_settings' );
		$style    = is_array( $settings ) && isset( $settings['styles']['value'] ) ? $settings['styles']['value'] : '';
		$show_sub = is_array( $settings ) && ! empty( $settings['enable_sub_heading'] );
		?>
		<table class="specifico-table specifico-<?php echo esc_attr( $style ); ?>" style="width: 100%">
			<?php foreach ( $groups as $group ) :
				if ( empty( $group ) ) {
					continue;
				}
				?>
				<?php if ( $show_sub && ! empty( $group['title'] ) ) : ?>
					<thead>
						<tr>
							<th colspan="2"><?php echo esc_html( $group['title'] ); ?></th>
						</tr>
					</thead>
				<?php endif; ?>
				<?php if ( ! empty( $group['inputGroups'] ) ) : ?>
					<tbody>
						<?php foreach ( $group['inputGroups'] as $row ) :
							if ( empty( $row[0] ) && empty( $row[1] ) ) {
								continue;
							}
							?>
							<tr>
								<td><?php echo esc_html( $row[0]['value'] ?? '' ); ?></td>
								<td><?php echo esc_html( $row[1]['value'] ?? '' ); ?></td>
							</tr>
						<?php endforeach; ?>
					</tbody>
				<?php endif; ?>
			<?php endforeach; ?>
		</table>
		<?php
	}
}
