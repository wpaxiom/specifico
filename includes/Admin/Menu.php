<?php

namespace WpAxiom\Specifico\Admin;

if ( ! defined( 'ABSPATH' ) ) exit;

class Menu {
	/**
	 * Menu constructor.
	 */
	public function __construct() {
		add_action('admin_menu', [ $this, 'admin_menu' ]);
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'admin_assets' ) );
	}

	/**
	 * Register Admin Page
	 */
	public function admin_menu() {
		add_menu_page( __( 'Specifico', 'specifico' ), __( 'Specifico', 'specifico' ), 'manage_options', 'specifico-options', '', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTUuMjgwNjUgOS4wNzUyM0M1LjI4MDY1IDkuMTY3NjEgNS4yOTU4NCA5LjI2MzUzIDUuMzMzODMgOS4zNTk0NkM1LjQ3MDU2IDkuNzMyNSA1Ljg1Nzk5IDkuOTcwNTMgNi4yNzU4IDkuOTQyMTFMMTYuODU3OCA5LjI1OTk4QzE2LjkwMzQgOS4yNTk5OCAxNi45NTI3IDkuMjU2NDMgMTYuOTk4MyA5LjI1NjQzQzE4LjA5MjIgOS4yNTY0MyAxOC45OTYyIDEwLjA4NzggMTguOTk2MiAxMS4xMjUyVjE3LjgyNTdDMTguOTk2MiAxOS4wMjY1IDE3Ljk1NTUgMjAgMTYuNjcxNyAyMEgzLjMyNDU0QzIuMDQwNzMgMjAgMSAxOS4wMjY1IDEgMTcuODI1N1YxNi43NzA1QzEgMTUuNzI5NiAxLjkwMzk5IDE0LjkwMTggMi45OTc4OSAxNC45MDE4QzMuMDQzNDcgMTQuOTAxOCAzLjA4OTA1IDE0LjkwMTggMy4xMzg0MyAxNC45MDUzTDEzLjI5MTIgMTUuNTU5QzEzLjg0NTcgMTUuNTk0NiAxNC4yODYzIDE1LjE3NTMgMTQuMjg2MyAxNC42OTIyQzE0LjI4NjMgMTQuNTk5OCAxNC4yNzEyIDE0LjUwMzkgMTQuMjMzMiAxNC40MDc5QzE0LjExMTYgMTQuMDc3NSAxMy43ODg4IDEzLjg0NjYgMTMuNDIwMyAxMy44MjUzTDMuMjY3NTcgMTMuMTcxNkMzLjE4MDIxIDEzLjE2NDUgMy4wODkwNSAxMy4xNjQ1IDMuMDAxNjkgMTMuMTY0NUMyLjQ4NTEyIDEzLjE2NDUgMS45Nzk5NSAxMy4yNjA0IDEuNTA1MTcgMTMuNDQ4N0MxLjUwNTE3IDEzLjQ0ODcgMS41MDUxNyAxMy40NDg3IDEuNTAxMzcgMTMuNDQ4N0MxLjI2NTg4IDEzLjU0MTEgMS4wMDc2IDEzLjM4NDcgMS4wMDc2IDEzLjE0NjdWNS4xNzQyOUMxLjAwNzYgMy45NzM0NiAyLjA0ODMyIDMgMy4zMzIxNCAzSDUuNTQyNzNDNS42MjYyOSAzIDUuNjkwODYgMy4wNjM5NSA1LjY5MDg2IDMuMTM4NTZDNS42OTA4NiAzLjkwOTUxIDYuMzU5MzYgNC41MzQ4IDcuMTgzNTggNC41MzQ4SDEyLjgyNEMxMy42NDgyIDQuNTM0OCAxNC4zMTY3IDMuOTA5NTEgMTQuMzE2NyAzLjEzODU2QzE0LjMxNjcgMy4wNjA0IDE0LjM4NTEgMyAxNC40NjQ5IDNIMTYuNjc1NUMxNy45NTkzIDMgMTkgMy45NzM0NiAxOSA1LjE3NDI5VjcuNDk3ODFDMTkgNy43MzU4NCAxOC43Mzc5IDcuODk1NzIgMTguNTA2MiA3Ljc5OTc5QzE4LjUwNjIgNy43OTk3OSAxOC41MDYyIDcuNzk5NzkgMTguNTAyNCA3Ljc5OTc5QzE4LjAyNzYgNy42MTE0OSAxNy41MjI1IDcuNTE1NTcgMTcuMDA1OSA3LjUxNTU3QzE2LjkxODUgNy41MTU1NyAxNi44Mjc0IDcuNTE1NTcgMTYuNzQgNy41MjI2N0w2LjE1ODA1IDguMjA0ODFDNS42NTI4OCA4LjIzNjc4IDUuMjkyMDQgOC42MzExNCA1LjI5MjA0IDkuMDcxNjhMNS4yODA2NSA5LjA3NTIzWiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTEzIDJWMi40OTgzMkMxMyAyLjc3NDQxIDEyLjc3NDUgMyAxMi40OTg2IDNINy41MDE0QzcuMjI1NDYgMyA3IDIuNzc3NzggNyAyLjQ5ODMyVjJDNyAxLjQ0NzgxIDcuNDQ3NTYgMSA3Ljk5OTQ0IDFIOC45MzgzMUw5LjA1NjA5IDAuNjY2NjY3QzkuMTk3NDIgMC4yNjU5OTMgOS41Nzc2OCAwIDkuOTk4MzIgMEMxMC40MTkgMCAxMC43OTkyIDAuMjY5MzYgMTAuOTQwNSAwLjY2NjY2N0wxMS4wNTgzIDFIMTEuOTk3MkMxMi41NDkxIDEgMTIuOTk2NiAxLjQ0NzgxIDEyLjk5NjYgMkgxM1oiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=');
		add_submenu_page( 'specifico-options', __( 'Specifications', 'specifico' ), __('Specifications', 'specifico' ), 'manage_options', 'specifico-options', [ $this, 'plugin_page' ] );
		add_submenu_page( 'specifico-options', __( 'Groups', 'specifico' ), __('Groups', 'specifico' ), 'manage_options', 'specifico-groups', [ $this, 'group_page' ] );
		add_submenu_page( 'specifico-options', __( 'Specification Mapping', 'specifico' ), __('Mapping', 'specifico' ), 'manage_options', 'specifico-mapping', [ $this, 'specification_mapping' ] );
		add_submenu_page( 'specifico-options', __( 'Settings', 'specifico' ), __('Settings', 'specifico' ), 'manage_options', 'specifico-settings', [ $this, 'specification_settings' ] );
	}

	/**
	 * Admin page callback function
	 */
	public function plugin_page() {
		?>
		<div id="specifico-admin"></div>
		<?php
	}

	/**
	 * Admin page callback function
	 */
	public function group_page() {
		?>
		<div id="specifico-groups"></div>
		<?php
	}

	/**
	 * Admin page callback function
	 */
	public function specification_mapping() {
		?>
		<div id="specifico-mapping"></div>
		<?php
	}

	/**
	 * Admin page callback function
	 */
	public function specification_settings() {
		?>
		<div id="specifico-settings"></div>
		<?php
	}

	public static function admin_assets() {
		$current_screen = get_current_screen();

		wp_enqueue_style( 'specifico-nunito-font', 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;500&display=swap', array(), SPECIFICO_VERSION );

		if ( 'toplevel_page_specifico-options' === $current_screen->id ) {
			wp_enqueue_script( 'admin-ui', SPECIFICO_URL . '/build/specification.js', array(
				'jquery',
				'wp-element',
			), SPECIFICO_VERSION, true );
			wp_localize_script( 'admin-ui', 'specificoAdminSettings', array(
				'url'     => esc_url_raw( rest_url() ),
				'nonce'   => wp_create_nonce( 'wp_rest' ),
				'version' => SPECIFICO_ASSETS,
				'tables'  => get_option( '_specifico_tables', 0 ) < 10 ? get_option( '_specifico_tables', 0 ) : 10,
			) );
		}

		if ( 'specifico_page_specifico-groups' === $current_screen->id ) {
			wp_enqueue_script( 'groups-ui', SPECIFICO_URL . '/build/groups.js', array( 'jquery', 'wp-element' ), SPECIFICO_VERSION, true );
			wp_localize_script( 'groups-ui', 'specificoAdminSettings', array(
				'url'     => esc_url_raw( rest_url() ),
				'nonce'   => wp_create_nonce( 'wp_rest' ),
				'version' => SPECIFICO_ASSETS,
				'groups'  => get_option( '_specifico_groups', 0 ) < 10 ? get_option( '_specifico_groups', 0 ) : 10,
			) );
		}

		if ( 'specifico_page_specifico-mapping' === $current_screen->id ) {
			wp_enqueue_script( 'attribute-mapping-ui', SPECIFICO_URL . '/build/mapping.js', array( 'jquery', 'wp-element' ), SPECIFICO_VERSION, true );
			wp_localize_script( 'attribute-mapping-ui', 'specificoAdminSettings', array(
				'url'     => esc_url_raw( rest_url() ),
				'nonce'   => wp_create_nonce( 'wp_rest' ),
				'version' => SPECIFICO_ASSETS,
				'mapping' => get_option( '_specifico_mapping' ) ? count( get_option( '_specifico_mapping' )  ) : 0,
			) );
		}

		if ( 'specifico_page_specifico-settings' === $current_screen->id ) {
			wp_enqueue_script( 'attribute-settings-ui', SPECIFICO_URL . '/build/settings.js', array( 'jquery', 'wp-element' ), SPECIFICO_VERSION, true );
			wp_localize_script( 'attribute-settings-ui', 'specificoAdminSettings', array(
				'url'     => esc_url_raw( rest_url() ),
				'nonce'   => wp_create_nonce( 'wp_rest' ),
				'version' => SPECIFICO_ASSETS,
			) );
		}

		if ( 'post' === $current_screen->base && 'product' === $current_screen->post_type ) {
			wp_enqueue_script( 'product-options', SPECIFICO_URL . '/build/productOptions.js', array( 'jquery', 'wp-element' ), SPECIFICO_VERSION, true );
			wp_localize_script( 'product-options', 'specificoAdminSettings', array(
				'url'     => esc_url_raw( rest_url() ),
				'nonce'   => wp_create_nonce( 'wp_rest' ),
				'version' => SPECIFICO_ASSETS,
				'post_id' => get_the_ID(),
			) );
		}
	}
}
