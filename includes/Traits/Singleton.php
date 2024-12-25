<?php
/**
 * Singleton Class trait
 *
 * @package specifico
 * @author WpAxiom <info@wpaxiom.com>
 * @version 1.0.0
 * @since 1.0.0
 */

namespace WpAxiom\Specifico\Traits;

if ( ! defined( 'ABSPATH' ) ) exit;

trait Singleton {
	/**
	 * Instance Variable
	 *
	 * @var $instance
	 */
	protected static $instance;

	/**
	 * Init instance
	 *
	 * @return bool|static
	 */
	public static function init() {
		static $instance = false;

		if ( ! $instance ) {
			$instance = new self();
		}
		return $instance;
	}

	/**
	 * Singleton Trait Constructor
	 */
	protected function __construct() {}

	/**
	 * Cloning is forbidden.
	 */
	public function __clone() {
		_doing_it_wrong( __FUNCTION__, esc_html__( 'Cloning is forbidden.', 'specifico' ), '1.0.0' );
	}

	/**
	 * Un-serializing instances of this class is forbidden.
	 */
	public function __wakeup() {
		_doing_it_wrong( __FUNCTION__, esc_html__( 'Un-serializing instances of this class is forbidden.', 'specifico' ), '1.0.0' );
	}
}

// End of file Singleton.php.
