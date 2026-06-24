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
 * @version 1.0.2
 *
 * @var array  $groups     Render-ready specification groups.
 * @var string $style      Table style slug from settings.
 * @var bool   $show_sub   Whether to render group sub-headings.
 * @var int    $product_id Product ID the table is rendered for.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$product_id = isset( $product_id ) ? (int) $product_id : 0;

/**
 * Filters the CSS classes applied to the specification table.
 *
 * @param array  $classes Table CSS classes.
 * @param string $style   Table style slug.
 */
$classes = apply_filters( 'specifico_table_classes', [ 'specifico-table', 'specifico-' . $style ], $style );
$classes = array_filter( array_map( 'sanitize_html_class', (array) $classes ) );

/**
 * Fires before the specification table.
 *
 * @param array $groups     Render-ready groups.
 * @param int   $product_id Product ID.
 */
do_action( 'specifico_before_table', $groups, $product_id );
?>
<table class="<?php echo esc_attr( implode( ' ', $classes ) ); ?>" style="width: 100%">
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

					$label = $row[0]['value'] ?? '';
					$value = $row[1]['value'] ?? '';

					/**
					 * Filters a specification row's label.
					 *
					 * Returned HTML is sanitized with wp_kses_post() on output.
					 *
					 * @param string $label      Row label.
					 * @param array  $row        Row data ( [ label, value ] ).
					 * @param int    $product_id Product ID.
					 */
					$label = apply_filters( 'specifico_row_label', $label, $row, $product_id );

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
					$value = apply_filters( 'specifico_row_value', $value, $row, $product_id );
					?>
					<tr>
						<td><?php echo wp_kses_post( $label ); ?></td>
						<td><?php echo wp_kses_post( $value ); ?></td>
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
do_action( 'specifico_after_table', $groups, $product_id );
