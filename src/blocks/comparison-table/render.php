<?php
/**
 * Comparison Table — server-side render.
 *
 * Resolves the compared products from the block attributes (or the
 * `?specifico_compare=` query var) and echoes the comparison table.
 *
 * WordPress invokes this file via the block metadata render callback
 * `ob_start(); require $file; return ob_get_clean();`, so it ECHOES its output
 * (into the wrapping buffer) rather than `return`ing it.
 *
 * @package specifico
 * @var array $attributes Block attributes.
 */

use WpAxiom\Specifico\Frontend\Comparison;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$specifico_atts = $attributes ?? array();
$specifico_ids  = $specifico_atts['ids'] ?? array();
$specifico_ids  = is_array( $specifico_ids ) ? $specifico_ids : array();
$specifico_raw  = implode( ',', array_map( 'absint', $specifico_ids ) );

// When the block carries no fixed products, fall back to the query var so the
// drawer's "open full page" link also works through the block, mirroring the
// [specifico_compare] shortcode.
if ( '' === $specifico_raw && isset( $_GET['specifico_compare'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only, public comparison view.
	$specifico_raw = sanitize_text_field( wp_unslash( $_GET['specifico_compare'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
}

if ( ! Comparison::is_enabled() ) {
	return;
}

$specifico_ids = Comparison::parse_ids( $specifico_raw );

if ( empty( $specifico_ids ) ) {
	echo '<div class="specifico-compare-empty">' . esc_html__( 'No products selected to compare.', 'specifico' ) . '</div>';
	return;
}

echo Comparison::get_html( $specifico_ids ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Fully escaped inside the comparison template.
