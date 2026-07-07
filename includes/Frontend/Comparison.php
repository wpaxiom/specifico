<?php
/**
 * Product comparison.
 *
 * Lets shoppers add products to a compare tray and view their specification
 * tables side by side, with differing rows highlighted. Reuses
 * Mapping_Resolver::resolve_product_groups() so a product's compared specs are
 * identical to what its Specifications tab shows.
 *
 * Surfaces:
 *   - "Add to compare" buttons on the single product page and shop/archive loop
 *   - A client-side tray (localStorage) rendered by assets/src/js/specifico.js
 *   - A slide-in drawer that fetches GET specifico/v1/compare and injects the
 *     rendered table
 *   - A [specifico_compare ids="1,2,3"] shortcode / block for a dedicated page
 *
 * @package specifico
 */

namespace WpAxiom\Specifico\Frontend;

use WpAxiom\Specifico\Mapping_Resolver;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Comparison {

	/**
	 * Comparison constructor.
	 */
	public function __construct() {
		if ( ! self::is_enabled() ) {
			return;
		}

		add_action( 'wp_enqueue_scripts', [ $this, 'localize' ], 20 );

		if ( self::show_on_single() ) {
			add_action( 'woocommerce_after_add_to_cart_button', [ $this, 'single_button' ] );
		}

		if ( self::show_on_archive() ) {
			add_action( 'woocommerce_after_shop_loop_item', [ $this, 'archive_button' ], 15 );
		}

		add_shortcode( 'specifico_compare', [ $this, 'render_shortcode' ] );
	}

	/**
	 * Whether the comparison feature is enabled (settings, filterable).
	 */
	public static function is_enabled(): bool {
		$settings = get_option( '_specifico_settings' );
		$enabled  = ! is_array( $settings ) || ! isset( $settings['enable_comparison'] )
			? false
			: (bool) $settings['enable_comparison'];

		/**
		 * Filters whether product comparison is enabled site-wide.
		 *
		 * @param bool $enabled Whether comparison is enabled.
		 */
		return (bool) apply_filters( 'specifico_comparison_enabled', $enabled );
	}

	/**
	 * Maximum number of products a shopper can compare at once (2–4).
	 */
	public static function max_products(): int {
		$settings = get_option( '_specifico_settings' );
		$max      = is_array( $settings ) && ! empty( $settings['compare_max'] ) ? (int) $settings['compare_max'] : 4;
		$max      = max( 2, min( 4, $max ) );

		/**
		 * Filters the maximum number of products that can be compared.
		 *
		 * @param int $max Maximum products (already clamped 2–4).
		 */
		return (int) apply_filters( 'specifico_compare_max', $max );
	}

	/**
	 * Whether difference highlighting is on.
	 */
	public static function highlight_diffs(): bool {
		$settings  = get_option( '_specifico_settings' );
		$highlight = ! is_array( $settings ) || ! isset( $settings['compare_highlight'] )
			? true
			: (bool) $settings['compare_highlight'];

		/**
		 * Filters whether differing rows are highlighted in the comparison table.
		 *
		 * @param bool $highlight Whether to highlight differences.
		 */
		return (bool) apply_filters( 'specifico_compare_highlight', $highlight );
	}

	/**
	 * Whether to show the compare button on the single product page.
	 */
	public static function show_on_single(): bool {
		$settings = get_option( '_specifico_settings' );
		$show     = ! is_array( $settings ) || ! isset( $settings['compare_on_single'] )
			? true
			: (bool) $settings['compare_on_single'];

		return (bool) apply_filters( 'specifico_compare_on_single', $show );
	}

	/**
	 * The compare button's visual style preset:
	 *   - 'theme'   inherit the active theme's button styling (chameleon)
	 *   - 'solid' | 'outline' | 'pill'  Specifico's own self-contained styles,
	 *             identical on every theme.
	 *
	 * The single-page and shop/archive buttons are styled independently, so the
	 * context selects which stored preset to read.
	 *
	 * @param string $context Button context: 'single' or 'archive'.
	 * @return string One of 'theme', 'solid', 'outline', 'pill', 'custom'.
	 */
	public static function button_style( string $context = 'single' ): string {
		$settings = get_option( '_specifico_settings' );
		$key      = 'archive' === $context ? 'compare_btn_style_archive' : 'compare_btn_style';
		$style    = is_array( $settings ) && ! empty( $settings[ $key ] )
			? sanitize_key( $settings[ $key ] )
			: 'theme';

		$allowed = [ 'theme', 'solid', 'outline', 'pill', 'custom' ];
		if ( ! in_array( $style, $allowed, true ) ) {
			$style = 'theme';
		}

		/**
		 * Filters the compare button style preset.
		 *
		 * @param string $style   One of 'theme', 'solid', 'outline', 'pill', 'custom'.
		 * @param string $context Button context: 'single' or 'archive'.
		 */
		return (string) apply_filters( 'specifico_compare_button_style', $style, $context );
	}

	/**
	 * Whether to show the compare button on shop/archive product cards.
	 */
	public static function show_on_archive(): bool {
		$settings = get_option( '_specifico_settings' );
		$show     = ! is_array( $settings ) || ! isset( $settings['compare_on_archive'] )
			? true
			: (bool) $settings['compare_on_archive'];

		return (bool) apply_filters( 'specifico_compare_on_archive', $show );
	}

	/**
	 * Expose config + strings to the frontend script (site-wide, so the tray
	 * persists across pages). Attaches to the handle registered by Tab.
	 */
	public function localize(): void {
		wp_localize_script(
			'specifico-scripts',
			'specificoCompare',
			[
				'restUrl'  => esc_url_raw( rest_url( 'specifico/v1/compare' ) ),
				'pageUrl'  => esc_url_raw( self::compare_page_url() ),
				'max'      => self::max_products(),
				'i18n'     => [
					'compare'  => __( 'Compare', 'specifico' ),
					'added'    => __( 'Added', 'specifico' ),
					'title'    => __( 'Compare products', 'specifico' ),
					'view'     => __( 'Compare', 'specifico' ),
					'clear'    => __( 'Clear', 'specifico' ),
					'close'    => __( 'Close', 'specifico' ),
					'remove'   => __( 'Remove', 'specifico' ),
					/* translators: %d: maximum number of products. */
					'maxAlert' => __( 'You can compare up to %d products.', 'specifico' ),
				],
			]
		);
	}

	/**
	 * URL of the dedicated compare page, if the merchant set one. Empty when
	 * unset — the drawer is the default surface. Filterable so a merchant can
	 * point it at any page holding the [specifico_compare] shortcode/block.
	 */
	public static function compare_page_url(): string {
		$settings = get_option( '_specifico_settings' );
		$page_id  = is_array( $settings ) && ! empty( $settings['compare_page'] ) ? (int) $settings['compare_page'] : 0;
		$url      = $page_id ? get_permalink( $page_id ) : '';

		/**
		 * Filters the dedicated comparison page URL.
		 *
		 * @param string $url     Permalink of the compare page (may be empty).
		 * @param int    $page_id Configured page ID.
		 */
		return (string) apply_filters( 'specifico_compare_page_url', $url ? $url : '', $page_id );
	}

	/**
	 * Output the compare button on the single product page.
	 */
	public function single_button(): void {
		global $product;
		if ( $product instanceof \WC_Product ) {
			echo self::button( $product->get_id() ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- button() returns escaped markup.
		}
	}

	/**
	 * Output the compare button on a shop/archive product card.
	 */
	public function archive_button(): void {
		global $product;
		if ( $product instanceof \WC_Product ) {
			echo self::button( $product->get_id(), 'archive' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- button() returns escaped markup.
		}
	}

	/**
	 * Build the "Add to compare" button markup for a product. Returns an empty
	 * string when the product has no specifications enabled.
	 *
	 * @param int    $product_id Product ID.
	 * @param string $context    Where the button renders: 'single' or 'archive'.
	 * @return string Escaped button HTML, or ''.
	 */
	public static function button( $product_id, string $context = 'single' ): string {
		$product_id = (int) $product_id;
		$has_specs  = 'yes' === get_post_meta( $product_id, '_specifico_spec', true );

		/**
		 * Filters whether the compare button renders for a product.
		 *
		 * Defaults to products that have the Specifications tab enabled.
		 *
		 * @param bool $show       Whether to show the button.
		 * @param int  $product_id Product ID.
		 */
		$show = (bool) apply_filters( 'specifico_compare_show_button', $has_specs, $product_id );

		if ( ! $show ) {
			return '';
		}

		$product = wc_get_product( $product_id );
		$name    = $product ? $product->get_name() : '';

		$context_class = 'archive' === $context ? 'specifico-compare-btn--archive' : 'specifico-compare-btn--single';
		$style         = self::button_style( $context );

		/**
		 * Base classes depend on the chosen style preset (Settings → Compare
		 * button style):
		 *
		 *   - 'theme' borrows WooCommerce's `button alt` (classic themes style
		 *     these on the add-to-cart button) and `wp-element-button` (block
		 *     themes — Twenty Twenty-Four/Five etc.), so the button inherits the
		 *     active theme's accent color and matches add-to-cart either way.
		 *   - any other preset SKIPS the theme classes and carries only
		 *     `specifico-compare-btn--style-{preset}`, so Specifico's own CSS
		 *     fully owns the look and stays identical across themes.
		 */
		$base = 'theme' === $style
			? [ 'button', 'alt', 'wp-element-button', 'specifico-compare-btn', $context_class ]
			: [ 'specifico-compare-btn', $context_class, 'specifico-compare-btn--style-' . $style ];

		/**
		 * Filters the CSS classes on the compare button. Remove `alt` (theme
		 * style) for a secondary button, or add your own classes.
		 *
		 * @param string[] $classes    Button CSS classes.
		 * @param int      $product_id Product ID.
		 */
		$classes = apply_filters(
			'specifico_compare_button_classes',
			$base,
			$product_id
		);
		$classes = implode( ' ', array_map( 'sanitize_html_class', (array) $classes ) );

		// Custom preset carries the merchant's inline CSS variables; other
		// presets need none (their look is fully in the stylesheet).
		$vars       = Custom_Style::button_inline_vars( $style, $context );
		$style_attr = '' !== $vars ? ' style="' . esc_attr( $vars ) . '"' : '';

		return sprintf(
			'<button type="button" class="%4$s"%5$s data-specifico-compare data-product-id="%1$d" data-product-name="%2$s" aria-pressed="false"><span class="specifico-compare-btn__label">%3$s</span></button>',
			$product_id,
			esc_attr( $name ),
			esc_html__( 'Compare', 'specifico' ),
			esc_attr( $classes ),
			$style_attr // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Pre-escaped attribute string.
		);
	}

	/**
	 * Render the [specifico_compare] shortcode.
	 *
	 * IDs come from the `ids` attribute, else the `specifico_compare` query var
	 * (so the drawer's "open full page" link works), else nothing.
	 *
	 * @param array|string $atts Shortcode attributes.
	 * @return string Comparison HTML, or an empty-state message.
	 */
	public function render_shortcode( $atts ): string {
		$atts = shortcode_atts( [ 'ids' => '' ], $atts, 'specifico_compare' );

		$raw = $atts['ids'];
		if ( '' === $raw && isset( $_GET['specifico_compare'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only, public comparison view.
			$raw = sanitize_text_field( wp_unslash( $_GET['specifico_compare'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		}

		$ids = self::parse_ids( $raw );

		if ( empty( $ids ) ) {
			return '<div class="specifico-compare-empty">' . esc_html__( 'No products selected to compare.', 'specifico' ) . '</div>';
		}

		return self::get_html( $ids );
	}

	/**
	 * Parse, sanitize, de-duplicate and cap a comma-separated list of product IDs.
	 *
	 * @param string $raw Comma-separated IDs.
	 * @return int[]
	 */
	public static function parse_ids( $raw ): array {
		$ids = array_filter( array_map( 'absint', explode( ',', (string) $raw ) ) );
		$ids = array_values( array_unique( $ids ) );

		return array_slice( $ids, 0, self::max_products() );
	}

	/**
	 * Render the comparison table for a set of product IDs and return the HTML.
	 *
	 * Used by both the shortcode and the REST endpoint that feeds the drawer.
	 *
	 * @param int[] $product_ids Product IDs.
	 * @return string
	 */
	public static function get_html( array $product_ids ): string {
		$data = self::build( $product_ids );

		if ( empty( $data['products'] ) ) {
			return '<div class="specifico-compare-empty">' . esc_html__( 'No products to compare.', 'specifico' ) . '</div>';
		}

		// The comparison table has its own appearance, independent of the spec
		// table. 'default' keeps the built-in look; 'custom' emits the merchant's
		// CSS variables and adds the .specifico-compare-custom wrapper class.
		$compare_style = Custom_Style::compare_table_style();
		$style         = 'custom' === $compare_style ? 'compare-custom' : '';

		ob_start();
		wc_get_template(
			'comparison-table.php',
			[
				'products'   => $data['products'],
				'groups'     => $data['groups'],
				'highlight'  => self::highlight_diffs(),
				'style'      => $style,
				'style_vars' => Custom_Style::compare_table_inline_vars( $compare_style ),
			],
			'specifico/',
			SPECIFICO_PATH . 'templates/'
		);

		return ob_get_clean();
	}

	/**
	 * Build the aligned comparison matrix for a set of products.
	 *
	 * Rows are aligned across products by group title + attribute name (the
	 * mapping already normalizes attribute names), so identical specs line up
	 * and a product missing a row shows a blank cell.
	 *
	 * Output:
	 *   [
	 *     'products' => [ [ id, name, url, image, price ], ... ],
	 *     'groups'   => [
	 *       [ 'title' => 'Display', 'rows' => [
	 *           [ 'label' => 'Size', 'values' => [ pid => '6.1"', ... ], 'differs' => true ],
	 *       ] ],
	 *     ],
	 *   ]
	 *
	 * @param int[] $product_ids Product IDs.
	 * @return array{products: array, groups: array}
	 */
	public static function build( array $product_ids ): array {
		$product_ids = self::parse_ids( implode( ',', $product_ids ) );

		$products    = [];
		$resolved    = [];

		foreach ( $product_ids as $pid ) {
			$product = wc_get_product( $pid );
			if ( ! $product ) {
				continue;
			}

			// The comparison is public (REST /compare and the [specifico_compare]
			// shortcode both accept arbitrary IDs from the request), so never
			// disclose products a visitor couldn't already view. Only published
			// products are exposed; editors keep preview access to drafts/private.
			if ( 'publish' !== $product->get_status() && ! current_user_can( 'read_post', $pid ) ) {
				continue;
			}

			$products[] = [
				'id'    => $pid,
				'name'  => $product->get_name(),
				'url'   => get_permalink( $pid ),
				'image' => $product->get_image( 'woocommerce_thumbnail' ),
				'price' => $product->get_price_html(),
			];

			$resolved[ $pid ] = Mapping_Resolver::resolve_product_groups( $pid );
		}

		// First pass: index every (group, row) across all products, preserving
		// first-seen order for both groups and rows.
		$group_order = [];
		$row_order   = [];
		$matrix      = [];

		foreach ( $resolved as $pid => $groups ) {
			if ( ! is_array( $groups ) ) {
				continue;
			}
			foreach ( $groups as $group ) {
				$title = isset( $group['title'] ) && '' !== $group['title'] ? $group['title'] : '__ungrouped__';

				if ( ! isset( $matrix[ $title ] ) ) {
					$group_order[]        = $title;
					$row_order[ $title ]  = [];
					$matrix[ $title ]     = [];
				}

				foreach ( (array) ( $group['inputGroups'] ?? [] ) as $row ) {
					$label = $row[0]['value'] ?? '';
					$value = $row[1]['value'] ?? '';

					if ( '' === $label && '' === $value ) {
						continue;
					}

					if ( ! isset( $matrix[ $title ][ $label ] ) ) {
						$row_order[ $title ][]      = $label;
						$matrix[ $title ][ $label ] = [];
					}

					$matrix[ $title ][ $label ][ $pid ] = $value;
				}
			}
		}

		// Second pass: emit aligned rows with per-product values + a diff flag.
		$pids   = wp_list_pluck( $products, 'id' );
		$groups = [];

		foreach ( $group_order as $title ) {
			$rows = [];
			foreach ( $row_order[ $title ] as $label ) {
				$values = [];
				foreach ( $pids as $pid ) {
					$values[ $pid ] = $matrix[ $title ][ $label ][ $pid ] ?? '';
				}

				$normalized = array_map(
					static function ( $v ) {
						return trim( wp_strip_all_tags( (string) $v ) );
					},
					$values
				);
				$differs = count( array_unique( $normalized ) ) > 1;

				$rows[] = [
					'label'   => $label,
					'values'  => $values,
					'differs' => $differs,
				];
			}

			$groups[] = [
				'title' => '__ungrouped__' === $title ? '' : $title,
				'rows'  => $rows,
			];
		}

		$data = [
			'products' => $products,
			'groups'   => $groups,
		];

		/**
		 * Filters the assembled comparison matrix before rendering.
		 *
		 * @param array $data        { products, groups }.
		 * @param int[] $product_ids Requested product IDs.
		 */
		return apply_filters( 'specifico_comparison_data', $data, $product_ids );
	}
}
