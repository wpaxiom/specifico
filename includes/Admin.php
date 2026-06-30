<?php
/**
 * Specifico Admin
 *
 * @package cartick
 * @author WpAxiom <info@wpaxiom.com>
 * @version 1.0.0
 * @since 1.0.0
 */

namespace WpAxiom\Specifico;

use WpAxiom\Specifico\Admin\Menu;
use WpAxiom\Specifico\Admin\Product_Data;
use WpAxiom\Specifico\Admin\Product_Type_Option;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Admin Menu Class
 */
class Admin {
	/**
	 * Admin constructor.
	 */
	function __construct() {
		new Menu();
		new Product_Data();

		add_action('admin_enqueue_scripts', [ $this, 'admin_assets' ]);
		add_filter( 'plugin_row_meta', [ $this, 'plugin_row_meta' ], 10, 2 );
	}

	/**
	 * Add a Documentation link to the plugin's row meta on the Plugins screen
	 * (the version / author-uri line).
	 *
	 * @param string[] $links Existing row meta links.
	 * @param string   $file  Plugin file the row meta is for.
	 * @return string[]
	 */
	public function plugin_row_meta( $links, $file ) {
		if ( plugin_basename( SPECIFICO_FILE ) === $file ) {
			$links[] = '<a href="' . esc_url( 'https://wpaxiom.com/docs/specifico' ) . '" target="_blank" rel="noopener noreferrer">' . esc_html__( 'Documentation', 'specifico' ) . '</a>';
		}

		return $links;
	}

	/**
	 * Admin assets
	 *
	 * Scope to Specifico admin pages and the WooCommerce product edit screen.
	 * The bundle ships Tailwind's preflight reset, which would otherwise leak
	 * into every WP admin page and visibly flash button styles on load.
	 */
	function admin_assets() {
		$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		if ( ! $screen ) {
			return;
		}

		$is_specifico_screen = false !== strpos( (string) $screen->id, 'specifico' );
		$is_product_edit     = 'product' === $screen->id;

		if ( ! $is_specifico_screen && ! $is_product_edit ) {
			return;
		}

		// Load the compiled Tailwind stylesheet in <head> so the admin SPAs paint
		// styled on first render. (Previously the CSS was injected at runtime by
		// admin.js in the footer, which caused a flash of unstyled content.)
		wp_enqueue_style( 'specifico-admin', SPECIFICO_ASSETS . '/dist/css/admin.css', array(), SPECIFICO_VERSION );
		wp_enqueue_script( 'specifico-admin', SPECIFICO_ASSETS . '/dist/js/admin.js', array( 'jquery' ), SPECIFICO_VERSION, true );
	}
}
