<?php
/**
 * Custom appearance (tables + compare button).
 *
 * When the merchant picks a "Custom" style — for the table (Settings → Table
 * style) or the compare button (Settings → Compare button style) — the
 * per-property values are emitted as CSS custom properties on the element. Only
 * values the merchant actually set are emitted; every unset property falls back
 * to a default declared in the stylesheet, so a mostly-blank "Custom" element
 * still renders sensibly.
 *
 * Shared by the spec table (Renderer), the comparison table + compare button
 * (Comparison), and the REST save handler (sanitisation), so every surface
 * honours the same values and the same safety rules.
 *
 * @package specifico
 */

namespace WpAxiom\Specifico\Frontend;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Custom_Style {

	/**
	 * Table setting key => CSS custom property. Keys not listed are ignored, so
	 * the settings payload can never inject an arbitrary property name.
	 *
	 * @var array<string,string>
	 */
	const TABLE_MAP = [
		'cell_padding'  => '--specifico-cell-padding',
		'radius'        => '--specifico-radius',
		'text_color'    => '--specifico-text-color',
		'cell_bg'       => '--specifico-cell-bg',
		'stripe_bg'     => '--specifico-stripe-bg',
		'border_color'  => '--specifico-border-color',
		'header_bg'     => '--specifico-header-bg',
		'header_color'  => '--specifico-header-color',
		'header_weight' => '--specifico-header-weight',
		'font_size'     => '--specifico-font-size',
		'font_weight'   => '--specifico-font-weight',
	];

	/**
	 * Compare-button setting key => CSS custom property.
	 *
	 * @var array<string,string>
	 */
	const BUTTON_MAP = [
		'padding'      => '--specifico-btn-padding',
		'radius'       => '--specifico-btn-radius',
		'text_color'   => '--specifico-btn-color',
		'bg'           => '--specifico-btn-bg',
		'border_color' => '--specifico-btn-border',
		'hover_bg'     => '--specifico-btn-hover-bg',
		'hover_text'   => '--specifico-btn-hover-color',
		'font_size'    => '--specifico-btn-font-size',
		'font_weight'  => '--specifico-btn-font-weight',
	];

	/**
	 * Comparison-table setting key => CSS custom property. Independent from the
	 * spec table so the side-by-side view can be styled on its own.
	 *
	 * @var array<string,string>
	 */
	const COMPARE_TABLE_MAP = [
		'cell_padding'  => '--specifico-ct-padding',
		'border_color'  => '--specifico-ct-border',
		'text_color'    => '--specifico-ct-color',
		'value_bg'      => '--specifico-ct-value-bg',
		'label_bg'      => '--specifico-ct-label-bg',
		'header_bg'     => '--specifico-ct-header-bg',
		'header_color'  => '--specifico-ct-header-color',
		'header_weight' => '--specifico-ct-header-weight',
		'diff_bg'       => '--specifico-ct-diff-bg',
		'font_size'     => '--specifico-ct-font-size',
		'font_weight'   => '--specifico-ct-font-weight',
	];

	/**
	 * Sanitized table appearance values (whitelisted keys, may be partial).
	 *
	 * @return array<string,string>
	 */
	public static function table_values(): array {
		return self::sanitize_map( self::TABLE_MAP, self::raw( 'custom_styles' ) );
	}

	/**
	 * Sanitized compare-button appearance values.
	 *
	 * Single-page and archive-card buttons never render on the same request, so
	 * both contexts reuse the same CSS custom properties (BUTTON_MAP) — only the
	 * stored values differ.
	 *
	 * @param string $context Button context: 'single' or 'archive'.
	 * @return array<string,string>
	 */
	public static function button_values( string $context = 'single' ): array {
		$key = 'archive' === $context ? 'compare_btn_styles_archive' : 'compare_btn_styles';

		return self::sanitize_map( self::BUTTON_MAP, self::raw( $key ) );
	}

	/**
	 * Sanitized comparison-table appearance values.
	 *
	 * @return array<string,string>
	 */
	public static function compare_table_values(): array {
		return self::sanitize_map( self::COMPARE_TABLE_MAP, self::raw( 'compare_table_styles' ) );
	}

	/**
	 * Active comparison-table style: 'default' (built-in look) or 'custom'.
	 *
	 * @return string
	 */
	public static function compare_table_style(): string {
		$settings = get_option( '_specifico_settings' );
		$style    = is_array( $settings ) && ! empty( $settings['compare_table_style'] )
			? sanitize_key( $settings['compare_table_style'] )
			: 'default';

		return in_array( $style, [ 'default', 'custom' ], true ) ? $style : 'default';
	}

	/**
	 * Inline CSS custom properties for the table, when the style is "custom".
	 *
	 * Only set values are emitted (fallbacks live in the stylesheet), so unset
	 * properties keep inheriting the theme.
	 *
	 * @param string $style Active table style slug.
	 * @return string e.g. "--specifico-cell-padding:12px;--specifico-radius:8px".
	 */
	public static function inline_vars( string $style ): string {
		if ( 'custom' !== $style ) {
			return '';
		}

		$values = self::table_values();

		/**
		 * Filters the custom table CSS variable declarations.
		 *
		 * @param string $css    Semicolon-separated `--var:value` declarations.
		 * @param array  $values Sanitized custom-style values.
		 */
		return (string) apply_filters( 'specifico_custom_style_vars', self::build_vars( self::TABLE_MAP, $values ), $values );
	}

	/**
	 * Inline CSS custom properties for the compare button, when its style is
	 * "custom".
	 *
	 * @param string $style   Active compare-button style slug.
	 * @param string $context Button context: 'single' or 'archive'.
	 * @return string
	 */
	public static function button_inline_vars( string $style, string $context = 'single' ): string {
		if ( 'custom' !== $style ) {
			return '';
		}

		$values = self::button_values( $context );

		/**
		 * Filters the custom compare-button CSS variable declarations.
		 *
		 * @param string $css    Semicolon-separated `--var:value` declarations.
		 * @param array  $values Sanitized button-style values.
		 */
		return (string) apply_filters( 'specifico_compare_button_vars', self::build_vars( self::BUTTON_MAP, $values ), $values );
	}

	/**
	 * Inline CSS custom properties for the comparison table, when its style is
	 * "custom".
	 *
	 * @param string $style Active comparison-table style slug.
	 * @return string
	 */
	public static function compare_table_inline_vars( string $style ): string {
		if ( 'custom' !== $style ) {
			return '';
		}

		$values = self::compare_table_values();

		/**
		 * Filters the custom comparison-table CSS variable declarations.
		 *
		 * @param string $css    Semicolon-separated `--var:value` declarations.
		 * @param array  $values Sanitized comparison-table values.
		 */
		return (string) apply_filters( 'specifico_compare_table_vars', self::build_vars( self::COMPARE_TABLE_MAP, $values ), $values );
	}

	/**
	 * Sanitize a raw table-appearance payload (whitelisted keys, safe values).
	 *
	 * @param array $raw Raw values.
	 * @return array<string,string>
	 */
	public static function sanitize_table( array $raw ): array {
		return self::sanitize_map( self::TABLE_MAP, $raw );
	}

	/**
	 * Sanitize a raw comparison-table-appearance payload.
	 *
	 * @param array $raw Raw values.
	 * @return array<string,string>
	 */
	public static function sanitize_compare_table( array $raw ): array {
		return self::sanitize_map( self::COMPARE_TABLE_MAP, $raw );
	}

	/**
	 * Sanitize a raw compare-button-appearance payload.
	 *
	 * @param array $raw Raw values.
	 * @return array<string,string>
	 */
	public static function sanitize_button( array $raw ): array {
		return self::sanitize_map( self::BUTTON_MAP, $raw );
	}

	/**
	 * Read a nested array setting from `_specifico_settings`.
	 *
	 * @param string $key Settings key.
	 * @return array
	 */
	private static function raw( string $key ): array {
		$settings = get_option( '_specifico_settings' );

		return is_array( $settings ) && isset( $settings[ $key ] ) && is_array( $settings[ $key ] )
			? $settings[ $key ]
			: [];
	}

	/**
	 * Build `--var:value;` declarations for the set values in a map.
	 *
	 * @param array $map    Key => CSS var map.
	 * @param array $values Sanitized values.
	 * @return string
	 */
	private static function build_vars( array $map, array $values ): string {
		$decls = [];

		foreach ( $map as $key => $var ) {
			if ( isset( $values[ $key ] ) && '' !== $values[ $key ] ) {
				$decls[] = $var . ':' . $values[ $key ];
			}
		}

		return implode( ';', $decls );
	}

	/**
	 * Whitelist keys against a map and sanitize each value.
	 *
	 * @param array $map Key => CSS var map.
	 * @param array $raw Raw values.
	 * @return array<string,string> Sanitized values, empty entries dropped.
	 */
	private static function sanitize_map( array $map, array $raw ): array {
		$clean = [];

		foreach ( $map as $key => $var ) {
			if ( ! isset( $raw[ $key ] ) ) {
				continue;
			}

			$value = self::sanitize_value( (string) $raw[ $key ] );
			if ( '' !== $value ) {
				$clean[ $key ] = $value;
			}
		}

		return $clean;
	}

	/**
	 * Sanitize a single CSS value so it cannot break out of the style attribute
	 * or inject additional declarations. Allows the tokens that make up lengths
	 * and colours (digits, units, %, #hex, rgb()/hsl() functions, keywords) and
	 * strips everything else — notably `;`, `:`, `{`, `}`, `<`, `>`, quotes.
	 *
	 * @param string $value Raw value.
	 * @return string Sanitized value (capped at 60 chars).
	 */
	public static function sanitize_value( string $value ): string {
		$value = preg_replace( '/[^a-zA-Z0-9#%.,()\s\-]/', '', $value );
		$value = trim( preg_replace( '/\s+/', ' ', (string) $value ) );

		return mb_substr( $value, 0, 60 );
	}
}
