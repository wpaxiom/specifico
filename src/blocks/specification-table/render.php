<?php
/**
 * Specification Table — server-side render.
 *
 * Resolves the table from the block attributes and echoes the rendered
 * specification table.
 *
 * WordPress invokes this file via the block metadata render callback
 * `ob_start(); require $file; return ob_get_clean();`, so it ECHOES its output
 * (into the wrapping buffer) rather than `return`ing it.
 *
 * @package specifico
 * @var array $attributes Block attributes.
 */

use WpAxiom\Specifico\Mapping_Resolver;
use WpAxiom\Specifico\Frontend\Custom_Style;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$specifico_atts     = $attributes ?? array();
$specifico_source   = $specifico_atts['source'] ?? 'current-product';
$specifico_table_id = (int) ( $specifico_atts['tableId'] ?? 0 );

$specifico_product_id = 0;
$specifico_groups     = array();

if ( 'specific-table' === $specifico_source && $specifico_table_id ) {
	/**
	 * Render a specific table directly (not tied to any product).
	 *
	 * @param array $groups     Render-ready groups.
	 * @param int   $product_id Product ID (0 = no product).
	 */
	$specifico_groups = apply_filters( 'specifico_table_groups', Mapping_Resolver::get_table_groups( $specifico_table_id ), 0 );
} else {
	// Auto-detect: use the current product from the loop.
	global $product;
	$specifico_product_id = $product instanceof \WC_Product ? (int) $product->get_id() : (int) get_the_ID();

	if ( $specifico_product_id ) {
		/**
		 * Filters the render-ready specification groups before output.
		 *
		 * Lets developers reorder, hide, or inject groups/rows programmatically.
		 *
		 * @param array $groups     Render-ready groups.
		 * @param int   $product_id Product ID.
		 */
		$specifico_groups = apply_filters( 'specifico_table_groups', Mapping_Resolver::resolve_product_groups( $specifico_product_id ), $specifico_product_id );
	}
}

if ( ! is_array( $specifico_groups ) || empty( $specifico_groups ) ) {
	return;
}

// Product-level values per stable row key, kept for the browser to fall back to
// while no variation is chosen.
$specifico_base_values = [];
foreach ( $specifico_groups as $specifico_bg => $specifico_group ) {
	if ( ! is_array( $specifico_group ) || empty( $specifico_group['inputGroups'] ) ) {
		continue;
	}
	foreach ( $specifico_group['inputGroups'] as $specifico_br => $specifico_row ) {
		$specifico_row_key                          = Mapping_Resolver::row_key( $specifico_row, $specifico_bg, $specifico_br );
		$specifico_base_values[ $specifico_row_key ] = is_array( $specifico_row ) && isset( $specifico_row[1]['value'] ) ? $specifico_row[1]['value'] : '';
	}
}

if ( $specifico_product_id ) {
	// Match the pre-selected variation instead of showing the parent's joined
	// option list, exactly like the product tab does.
	$specifico_variation_id = Mapping_Resolver::default_variation_id( $specifico_product_id );

	if ( $specifico_variation_id ) {
		$specifico_groups = Mapping_Resolver::apply_variation_values( $specifico_groups, $specifico_variation_id );
	}
}

$specifico_settings = get_option( '_specifico_settings' );
$specifico_style    = is_array( $specifico_settings ) && isset( $specifico_settings['styles']['value'] ) ? (string) $specifico_settings['styles']['value'] : '';
$specifico_show_sub = is_array( $specifico_settings ) && ! empty( $specifico_settings['enable_sub_heading'] );

/**
 * Filters the CSS classes applied to the specification table.
 *
 * @param array  $classes Table CSS classes.
 * @param string $style   Table style slug.
 */
$specifico_classes = apply_filters( 'specifico_table_classes', array( 'specifico-table', 'specifico-' . $specifico_style ), $specifico_style );
$specifico_classes = array_filter( array_map( 'sanitize_html_class', (array) $specifico_classes ) );

/**
 * Fires before the specification table.
 *
 * @param array $groups     Render-ready groups.
 * @param int   $product_id Product ID.
 */
do_action( 'specifico_before_table', $specifico_groups, $specifico_product_id );

$specifico_style_attr = 'width: 100%';
$specifico_style_vars = Custom_Style::inline_vars( $specifico_style );
if ( '' !== $specifico_style_vars ) {
	$specifico_style_attr .= ';' . $specifico_style_vars;
}
?>
<table class="<?php echo esc_attr( implode( ' ', $specifico_classes ) ); ?>" style="<?php echo esc_attr( $specifico_style_attr ); ?>"<?php echo $specifico_product_id ? ' data-specifico-product="' . esc_attr( $specifico_product_id ) . '"' : ''; ?>>
	<?php foreach ( $specifico_groups as $specifico_group_index => $specifico_group ) :
		if ( empty( $specifico_group ) ) {
			continue;
		}

		$specifico_is_auto = ! empty( $specifico_group['auto'] );
		?>
		<?php if ( $specifico_show_sub && ! empty( $specifico_group['title'] ) ) : ?>
			<thead>
				<tr>
					<th colspan="2"><?php echo esc_html( $specifico_group['title'] ); ?></th>
				</tr>
			</thead>
		<?php endif; ?>
		<?php if ( ! empty( $specifico_group['inputGroups'] ) ) : ?>
			<tbody>
				<?php foreach ( $specifico_group['inputGroups'] as $specifico_row_index => $specifico_row ) :
					if ( empty( $specifico_row[0] ) && empty( $specifico_row[1] ) ) {
						continue;
					}

					$specifico_label = $specifico_row[0]['value'] ?? '';
					$specifico_value = $specifico_row[1]['value'] ?? '';

					/**
					 * Filters a specification row's label.
					 *
					 * @param string $label      Row label.
					 * @param array  $row        Row data ( [ label, value ] ).
					 * @param int    $product_id Product ID.
					 */
					$specifico_label = apply_filters( 'specifico_row_label', $specifico_label, $specifico_row, $specifico_product_id );

					/**
					 * Filters a specification row's value.
					 *
					 * @param string $value      Row value.
					 * @param array  $row        Row data ( [ label, value ] ).
					 * @param int    $product_id Product ID.
					 */
					$specifico_value = apply_filters( 'specifico_row_value', $specifico_value, $specifico_row, $specifico_product_id );

					$specifico_key  = Mapping_Resolver::row_key( $specifico_row, $specifico_group_index, $specifico_row_index );
					$specifico_base = $specifico_value;
					$specifico_attribute = ! empty( $specifico_row['attribute'] ) && function_exists( 'wc_variation_attribute_name' )
						? wc_variation_attribute_name( $specifico_row['attribute'] )
						: '';

					if ( isset( $specifico_base_values[ $specifico_key ] ) && $specifico_base_values[ $specifico_key ] !== ( $specifico_row[1]['value'] ?? '' ) ) {
						$specifico_base_row             = $specifico_row;
						$specifico_base_row[1]['value'] = $specifico_base_values[ $specifico_key ];
						$specifico_base                 = apply_filters( 'specifico_row_value', $specifico_base_values[ $specifico_key ], $specifico_base_row, $specifico_product_id );
					}
					?>
					<tr<?php echo $specifico_is_auto ? ' data-specifico-auto="attribute"' : ''; ?>>
						<td><?php echo wp_kses_post( $specifico_label ); ?></td>
						<td class="specifico-variation-value" data-specifico-row="<?php echo esc_attr( $specifico_key ); ?>" data-specifico-base="<?php echo esc_attr( $specifico_base ); ?>"<?php echo $specifico_attribute ? ' data-specifico-attribute="' . esc_attr( $specifico_attribute ) . '"' : ''; ?>><?php echo wp_kses_post( $specifico_value ); ?></td>
					</tr>
				<?php endforeach; ?>
			</tbody>
		<?php endif; ?>
	<?php endforeach; ?>
</table>
<?php
/**
 * Fires after the specification table.
 *
 * @param array $groups     Render-ready groups.
 * @param int   $product_id Product ID.
 */
do_action( 'specifico_after_table', $specifico_groups, $specifico_product_id );
