<?php

namespace WpAxiom\Specifico;

if ( ! defined( 'ABSPATH' ) ) exit;
class Frontend {
	/**
	 * Frontend constructor.
	 */
	function __construct() {
		new Frontend\Tab();
	}
}
