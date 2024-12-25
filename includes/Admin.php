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
	 */
	function admin_assets() {
		wp_enqueue_script( 'specifico-admin', SPECIFICO_ASSETS . '/dist/js/admin.js', array( 'jquery' ), SPECIFICO_VERSION, true );

		if ( is_admin() && 'specifico_page_specifico-groups' === get_current_screen()->id ) {
			//wp_deregister_style('wp-admin');
		}
	}
}
