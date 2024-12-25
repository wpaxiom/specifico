<?php
/**
 * Plugin Name:       Specifico – Product Specification for WooCommerce
 * Plugin URI:        https://wpaxiom.com/specifico
 * Description:       Specifico is a powerful WordPress plugin designed exclusively for showcase WooCommerce product specification table.
 * Version:           1.0.1
 * Author:            WPaxiom
 * Author URI:        https://wpaxiom.com
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       specifico
 * Domain Path:       /languages
 * Requires Plugins:  woocommerce
 *
 * Requires PHP: 7.4
 * Requires at least: 5.8
 * Tested up to: 6.7
 * WC requires at least: 6.3
 * WC tested up to: 9.5
 *
 * @package 
 * @author WpAxiom <info@wpaxiom.com>
 * @version 1.0.1
 * @since 1.0.1
 */

if ( ! defined( 'ABSPATH' ) ) exit;

if ( ! defined( 'SPECIFICO_VERSION' ) ) {
	define( 'SPECIFICO_VERSION', '1.0.1' );
}

if ( ! defined( 'SPECIFICO_FILE' ) ) {
	define( 'SPECIFICO_FILE', __FILE__ );
}

if ( ! defined( 'SPECIFICO_PATH' ) ) {
	define( 'SPECIFICO_PATH', plugin_dir_path( SPECIFICO_FILE ) );
}

if ( ! defined( 'SPECIFICO_URL' ) ) {
	define( 'SPECIFICO_URL', plugins_url( 'specifico' ) );
}

if ( ! defined( 'SPECIFICO_ASSETS' ) ) {
	define( 'SPECIFICO_ASSETS', SPECIFICO_URL . '/assets' );
}

/**
 * Specifico helper
 */
include 'specifico-helper.php';

/**
 * Composer autoload
 */

if ( file_exists( SPECIFICO_PATH . '/vendor/autoload.php' ) ) {

	require_once SPECIFICO_PATH . '/vendor/autoload.php';

	/**
	 * Plugin Initializer.
	 */
	function specifico() {
		return WpAxiom\Specifico\Specifico::init();
	}
	// Initialize.
	specifico();

} else {
	add_action(
		'admin_notices',
		function () {
			?>
			<div class="notice notice-error notice-alt">
				<p><?php esc_html_e( 'Cannot initialize “Specifico” plugin. <code>vendor/autoload.php</code> is missing. Please run <code>composer dump-autoload -o</code> within the this plugin directory.', 'specifico' ); ?></p>
			</div>
			<?php
		}
	);
}

// End of file specifico.php.
