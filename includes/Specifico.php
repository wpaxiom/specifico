<?php
/**
 *
 * ███████╗██████╗ ███████╗ ██████╗██╗███████╗██╗ ██████╗ ██████╗
 * ██╔════╝██╔══██╗██╔════╝██╔════╝██║██╔════╝██║██╔════╝██╔═══██╗
 * ███████╗██████╔╝█████╗  ██║     ██║█████╗  ██║██║     ██║   ██║
 * ╚════██║██╔═══╝ ██╔══╝  ██║     ██║██╔══╝  ██║██║     ██║   ██║
 * ███████║██║     ███████╗╚██████╗██║██║     ██║╚██████╗╚██████╔╝
 * ╚══════╝╚═╝     ╚══════╝ ╚═════╝╚═╝╚═╝     ╚═╝ ╚═════╝ ╚═════╝
 *
 * @package specifico
 * @author WpAxiom <info@wpaxiom.com>
 * @version 1.0.0
 * @since 1.0.0
 */

namespace WpAxiom\Specifico;

use WpAxiom\Specifico\Traits\Singleton;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Initialize Class Specifico
 */
final class Specifico {

	use singleton;

	/**
	 * Specifico Class Constructor
	 */
	public function __construct() {
		//add_action( 'plugins_loaded', array( $this, 'init_data' ) );
		add_action( 'plugins_loaded', [ $this, 'init_plugin' ] );
		add_action( 'init', [ $this, 'table_post_type' ], 0 );
		add_action( 'init', [ $this, 'group_post_type' ], 0 );

	}

	/**
	 * Initialize Plugin
	 */
	public function init_plugin(): void {
		if ( is_admin() ) {
			new Admin();
		} else {
			new Frontend();
		}

		new Specifico_Rest_Route();

		// Enable HPOS for WooCommerce
		add_action( 'before_woocommerce_init', array( $this, 'enable_hpos' ) );
	}

	/**
	 * Specification post type labels
	 * @return array
	 */
	public function specifico_table_labels() {
		return array(
			'name'                  => _x( 'Specifications', 'Post Type General Name', 'specifico' ),
			'singular_name'         => _x( 'Specification', 'Post Type Singular Name', 'specifico' ),
			'menu_name'             => __( 'Specifications', 'specifico' ),
			'name_admin_bar'        => __( 'Specifications', 'specifico' ),
			'archives'              => __( 'Specification Archives', 'specifico' ),
			'attributes'            => __( 'Specification Attributes', 'specifico' ),
			'parent_item_colon'     => __( 'Parent Specification:', 'specifico' ),
			'all_items'             => __( 'All Specifications', 'specifico' ),
			'add_new_item'          => __( 'Add New Specification', 'specifico' ),
			'add_new'               => __( 'Add New Specification', 'specifico' ),
			'new_item'              => __( 'New Specification', 'specifico' ),
			'edit_item'             => __( 'Edit Specification', 'specifico' ),
			'update_item'           => __( 'Update Specification', 'specifico' ),
			'view_item'             => __( 'View Specification', 'specifico' ),
			'view_items'            => __( 'View Specifications', 'specifico' ),
			'search_items'          => __( 'Search Specification', 'specifico' ),
			'not_found'             => __( 'Not found', 'specifico' ),
			'not_found_in_trash'    => __( 'Not found in Trash', 'specifico' ),
			'featured_image'        => __( 'Featured Image', 'specifico' ),
			'set_featured_image'    => __( 'Set featured image', 'specifico' ),
			'remove_featured_image' => __( 'Remove featured image', 'specifico' ),
			'use_featured_image'    => __( 'Use as featured image', 'specifico' ),
			'insert_into_item'      => __( 'Insert Specification', 'specifico' ),
			'uploaded_to_this_item' => __( 'Uploaded to this Specification', 'specifico' ),
			'items_list'            => __( 'Specifications list', 'specifico' ),
			'items_list_navigation' => __( 'Specifications list navigation', 'specifico' ),
			'filter_items_list'     => __( 'Filter Specifications list', 'specifico' ),
		);
	}

	/**
	 * Register post type for specification
	 *
	 * @return void
	 */
	public function table_post_type() {
		$args = array(
			'label'               => __( 'Specification', 'specifico' ),
			'description'         => __( 'Product Specifications', 'specifico' ),
			'labels'              => $this->specifico_table_labels(),
			'supports'            => array( 'title' ),
			'taxonomies'          => array( 'category', 'post_tag' ),
			'hierarchical'        => false,
			'public'              => true,
			'show_ui'             => true,
			'show_in_menu'        => false,
			'show_in_rest'        => true,
			'menu_position'       => 5,
			'show_in_admin_bar'   => false,
			'show_in_nav_menus'   => false,
			'can_export'          => true,
			'has_archive'         => true,
			'exclude_from_search' => false,
			'publicly_queryable'  => true,
			'capability_type'     => 'page',
		);
		register_post_type( 'specifico-table', $args );

	}

	/**
	 * Specification post type labels
	 * @return array
	 */
	public function specifico_group_labels() {
		return array(
			'name'                  => _x( 'Groups', 'Post Type General Name', 'specifico' ),
			'singular_name'         => _x( 'Group', 'Post Type Singular Name', 'specifico' ),
			'menu_name'             => __( 'Groups', 'specifico' ),
			'name_admin_bar'        => __( 'Groups', 'specifico' ),
			'archives'              => __( 'Group Archives', 'specifico' ),
			'attributes'            => __( 'Group Attributes', 'specifico' ),
			'parent_item_colon'     => __( 'Parent Group:', 'specifico' ),
			'all_items'             => __( 'All Groups', 'specifico' ),
			'add_new_item'          => __( 'Add New Group', 'specifico' ),
			'add_new'               => __( 'Add New Group', 'specifico' ),
			'new_item'              => __( 'New Group', 'specifico' ),
			'edit_item'             => __( 'Edit Group', 'specifico' ),
			'update_item'           => __( 'Update Group', 'specifico' ),
			'view_item'             => __( 'View Group', 'specifico' ),
			'view_items'            => __( 'View Group', 'specifico' ),
			'search_items'          => __( 'Search Group', 'specifico' ),
			'not_found'             => __( 'Not found', 'specifico' ),
			'not_found_in_trash'    => __( 'Not found in Trash', 'specifico' ),
			'featured_image'        => __( 'Featured Image', 'specifico' ),
			'set_featured_image'    => __( 'Set featured image', 'specifico' ),
			'remove_featured_image' => __( 'Remove featured image', 'specifico' ),
			'use_featured_image'    => __( 'Use as featured image', 'specifico' ),
			'insert_into_item'      => __( 'Insert Group', 'specifico' ),
			'uploaded_to_this_item' => __( 'Uploaded to this Group', 'specifico' ),
			'items_list'            => __( 'Groups list', 'specifico' ),
			'items_list_navigation' => __( 'Groups list navigation', 'specifico' ),
			'filter_items_list'     => __( 'Filter Groups list', 'specifico' ),
		);
	}

	/**
	 * Register post type for specification
	 *
	 * @return void
	 */
	public function group_post_type() {
		$args = array(
			'label'               => __( 'Group', 'specifico' ),
			'description'         => __( 'Product Groups', 'specifico' ),
			'labels'              => $this->specifico_group_labels(),
			'supports'            => array( 'title' ),
			'taxonomies'          => array( 'category', 'post_tag' ),
			'hierarchical'        => false,
			'public'              => true,
			'show_ui'             => true,
			'show_in_menu'        => false,
			'show_in_rest'        => true,
			'menu_position'       => 5,
			'show_in_admin_bar'   => false,
			'show_in_nav_menus'   => false,
			'can_export'          => true,
			'has_archive'         => true,
			'exclude_from_search' => false,
			'publicly_queryable'  => true,
			'capability_type'     => 'page',
		);
		register_post_type( 'specifico-groups', $args );

	}

	/**
	 * Enable High-Performance Order Storage (HPOS)
	 *
	 * @return void
	 */
	public function enable_hpos() {
		if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
			\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', SPECIFICO_FILE, true );
		}
	}
}

/**
 * Initialize main plugin
 *
 * @return false|specifico
 */
function specifico() {
	return Specifico::init();
}

specifico();
