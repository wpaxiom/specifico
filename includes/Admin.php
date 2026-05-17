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

		wp_enqueue_script( 'specifico-admin', SPECIFICO_ASSETS . '/dist/js/admin.js', array( 'jquery' ), SPECIFICO_VERSION, true );
	}
}
