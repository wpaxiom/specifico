<?php

namespace WpAxiom\Specifico\Frontend;

use WpAxiom\Specifico\Admin\Template as Template;

class Tab {

	function __construct() {
		add_filter( 'woocommerce_product_tabs', [ $this, 'specification_tab' ] );
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_scripts' ] );
	}

	/**
	 * Add a custom product data tab
	 */
	function specification_tab( $tabs ) {
		global $product;

		$specification_option = get_post_meta( $product->get_id(), '_specifico_spec', true);
		if ( 'yes' === $specification_option ) {

			$tabs['specification'] = array(
				'title'    => __( 'Specifications', 'specifico' ),
				'priority' => 10,
				'callback' => [ $this, 'specification_tab_content' ],
			);
		}

		return $tabs;

	}

	function enqueue_scripts() {
		wp_enqueue_script( 'specifico-scripts', SPECIFICO_URL . '/assets/dist/js/specifico.js', array(), SPECIFICO_VERSION, true );
	}

	/**
	 * Specification Table
	 */
	function specification_tab_content() {
		$table_groups = get_post_meta( get_the_ID(), '_specifico_groups', true );
		$settings     = get_option( '_specifico_settings', true );

		if ( ! is_array( $table_groups ) ) {
			return;
		}
		
		?>
		<table class="specifico-table specifico-<?php echo esc_attr( $settings['styles']['value'] ) ?>" style="width: 100%">
			<?php foreach ( $table_groups as $group ) :
				if ( ! empty( $group ) ) :

					if ( $settings['enable_sub_heading'] ) : ?>
					<thead>
					<tr>
						<th colspan="2">
							<?php echo esc_html( $group['title'] ); ?>
						</th>
					</tr>
					</thead>
					<?php endif;

					if ( ! empty( $group['inputGroups'] ) ) : ?>
						<tbody>
						<?php foreach ( $group['inputGroups'] as $row ) : ?>
							<tr>
								<td><?php echo esc_html( $row[0]['value'] ); ?></td>
								<td><?php echo esc_html( $row[1]['value'] ); ?></td>
							</tr>
						<?php endforeach; ?>
						</tbody>
					<?php endif;
				endif;
			endforeach;
			?>
		</table>
		<?php
	}
}
