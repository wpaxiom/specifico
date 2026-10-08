<?php
/**
 * Specification table.
 *
 * This template can be overridden by copying it to
 * yourtheme/specifico/specification-table.php.
 *
 * HOWEVER, on occasion Specifico will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @package specifico
 * @version 1.0.8
 *
 * @var array  $groups      Render-ready specification groups.
 * @var string $style       Table style slug from settings.
 * @var string $style_vars  Inline CSS custom properties for the "custom" style.
 * @var bool   $show_sub    Whether to render group sub-headings.
 * @var int    $product_id  Product ID the table is rendered for.
 * @var array  $base_values Product-level value per stable row key, before any
 *                           variation was applied. The browser falls back to
 *                           these when no variation is chosen.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$specifico_product_id = isset( $product_id ) ? (int) $product_id : 0;
$specifico_base_map   = isset( $base_values ) && is_array( $base_values ) ? $base_values : [];

/**
 * Filters the CSS classes applied to the specification table.
 *
 * @param array  $classes Table CSS classes.
 * @param string $style   Table style slug.
 */
$specifico_classes = apply_filters( 'specifico_table_classes', [ 'specifico-table', 'specifico-' . $style ], $style );
$specifico_classes = array_filter( array_map( 'sanitize_html_class', (array) $specifico_classes ) );

/**
 * Fires before the specification table.
 *
 * @param array $groups     Render-ready groups.
 * @param int   $product_id Product ID.
 */
do_action( 'specifico_before_table', $groups, $specifico_product_id );

$specifico_style_attr = 'width: 100%';
if ( ! empty( $style_vars ) ) {
	$specifico_style_attr .= ';' . $style_vars;
}
?>
<table class="<?php echo esc_attr( implode( ' ', $specifico_classes ) ); ?>" style="<?php echo esc_attr( $specifico_style_attr ); ?>"<?php echo $specifico_product_id ? ' data-specifico-product="' . esc_attr( $specifico_product_id ) . '"' : ''; ?>>
	<?php foreach ( $groups as $specifico_group_index => $specifico_group ) :
		if ( empty( $specifico_group ) ) {
			continue;
		}

		$specifico_is_auto = ! empty( $specifico_group['auto'] );
		?>
		<?php if ( $show_sub && ! empty( $specifico_group['title'] ) ) : ?>
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
					 * Returned HTML is sanitized with wp_kses_post() on output.
					 *
					 * @param string $label      Row label.
					 * @param array  $row        Row data ( [ label, value ] ).
					 * @param int    $product_id Product ID.
					 */
					$specifico_label = apply_filters( 'specifico_row_label', $specifico_label, $specifico_row, $specifico_product_id );

					/**
					 * Filters a specification row's value.
					 *
					 * Returned HTML is sanitized with wp_kses_post() on output, so
					 * links and basic markup are allowed.
					 *
					 * @param string $value      Row value.
					 * @param array  $row        Row data ( [ label, value ] ).
					 * @param int    $product_id Product ID.
					 */
					$specifico_value = apply_filters( 'specifico_row_value', $specifico_value, $specifico_row, $specifico_product_id );

					// The product-level value this cell falls back to when no
					// variation is chosen (or when the chosen one has no override
					// for this row).
					$specifico_key  = \WpAxiom\Specifico\Mapping_Resolver::row_key( $specifico_row, $specifico_group_index, $specifico_row_index );
					$specifico_base = $specifico_value;
					$specifico_attribute = ! empty( $specifico_row['attribute'] ) && function_exists( 'wc_variation_attribute_name' )
						? wc_variation_attribute_name( $specifico_row['attribute'] )
						: '';

					if ( isset( $specifico_base_map[ $specifico_key ] ) && $specifico_base_map[ $specifico_key ] !== ( $specifico_row[1]['value'] ?? '' ) ) {
						$specifico_base_row             = $specifico_row;
						$specifico_base_row[1]['value'] = $specifico_base_map[ $specifico_key ];
						$specifico_base                 = apply_filters( 'specifico_row_value', $specifico_base_map[ $specifico_key ], $specifico_base_row, $specifico_product_id );
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
do_action( 'specifico_after_table', $groups, $specifico_product_id );
