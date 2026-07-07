<?php
/**
 * Product comparison table.
 *
 * This template can be overridden by copying it to
 * yourtheme/specifico/comparison-table.php.
 *
 * HOWEVER, on occasion Specifico will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @package specifico
 * @version 1.1.0
 *
 * @var array  $products   Compared products: [ [ id, name, url, image, price ], ... ].
 * @var array  $groups     Aligned groups: [ [ title, rows: [ [ label, values, differs ] ] ] ].
 * @var bool   $highlight  Whether to highlight differing rows.
 * @var string $style      Table style slug from settings.
 * @var string $style_vars Inline CSS custom properties for the "custom" style.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$specifico_products = isset( $products ) && is_array( $products ) ? $products : [];
$specifico_groups   = isset( $groups ) && is_array( $groups ) ? $groups : [];
$specifico_colspan  = count( $specifico_products ) + 1;

/**
 * Filters the CSS classes applied to the comparison table wrapper.
 *
 * @param array  $classes Wrapper CSS classes.
 * @param string $style   Table style slug.
 */
$specifico_classes = apply_filters(
	'specifico_comparison_classes',
	[ 'specifico-comparison', 'specifico-' . $style ],
	$style
);
$specifico_classes = array_filter( array_map( 'sanitize_html_class', (array) $specifico_classes ) );

/**
 * Fires before the comparison table.
 *
 * @param array $products Compared products.
 * @param array $groups   Aligned groups.
 */
do_action( 'specifico_before_comparison', $specifico_products, $specifico_groups );

$specifico_style_attr = isset( $style_vars ) ? (string) $style_vars : '';
?>
<div class="<?php echo esc_attr( implode( ' ', $specifico_classes ) ); ?>"<?php echo $specifico_style_attr ? ' style="' . esc_attr( $specifico_style_attr ) . '"' : ''; ?>>
	<table class="specifico-comparison-table">
		<thead>
			<tr>
				<th class="specifico-comparison-table__corner" scope="col"></th>
				<?php foreach ( $specifico_products as $specifico_product ) : ?>
					<th class="specifico-comparison-table__product" scope="col">
						<a class="specifico-comparison-table__product-link" href="<?php echo esc_url( $specifico_product['url'] ); ?>">
							<span class="specifico-comparison-table__product-image"><?php echo wp_kses_post( $specifico_product['image'] ); ?></span>
							<span class="specifico-comparison-table__product-name"><?php echo esc_html( $specifico_product['name'] ); ?></span>
						</a>
						<?php if ( ! empty( $specifico_product['price'] ) ) : ?>
							<span class="specifico-comparison-table__product-price"><?php echo wp_kses_post( $specifico_product['price'] ); ?></span>
						<?php endif; ?>
						<button type="button" class="specifico-comparison-table__remove" data-specifico-compare-remove data-product-id="<?php echo (int) $specifico_product['id']; ?>" aria-label="<?php esc_attr_e( 'Remove from comparison', 'specifico' ); ?>">&times;</button>
					</th>
				<?php endforeach; ?>
			</tr>
		</thead>

		<?php foreach ( $specifico_groups as $specifico_group ) : ?>
			<tbody>
				<?php if ( ! empty( $specifico_group['title'] ) ) : ?>
					<tr class="specifico-comparison-table__group">
						<th colspan="<?php echo (int) $specifico_colspan; ?>" scope="colgroup"><?php echo esc_html( $specifico_group['title'] ); ?></th>
					</tr>
				<?php endif; ?>

				<?php foreach ( $specifico_group['rows'] as $specifico_row ) : ?>
					<?php $specifico_diff = $highlight && ! empty( $specifico_row['differs'] ) ? ' is-diff' : ''; ?>
					<tr class="specifico-comparison-table__row<?php echo esc_attr( $specifico_diff ); ?>">
						<th class="specifico-comparison-table__label" scope="row"><?php echo wp_kses_post( $specifico_row['label'] ); ?></th>
						<?php foreach ( $specifico_products as $specifico_product ) : ?>
							<?php
							$specifico_value = $specifico_row['values'][ $specifico_product['id'] ] ?? '';
							$specifico_value = '' === trim( wp_strip_all_tags( (string) $specifico_value ) ) ? '&mdash;' : wp_kses_post( $specifico_value );
							?>
							<td class="specifico-comparison-table__value"><?php echo $specifico_value; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Sanitized above with wp_kses_post or a literal em dash. ?></td>
						<?php endforeach; ?>
					</tr>
				<?php endforeach; ?>
			</tbody>
		<?php endforeach; ?>
	</table>
</div>
<?php
/**
 * Fires after the comparison table.
 *
 * @param array $products Compared products.
 * @param array $groups   Aligned groups.
 */
do_action( 'specifico_after_comparison', $specifico_products, $specifico_groups );
