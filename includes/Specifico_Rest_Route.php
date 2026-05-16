<?php
/**
 * Specifico Settings Rest Route
 *
 * @package specifico
 * @author WpAxiom <info@wpaxiom.com>
 * @version 1.0.0
 * @since 1.0.0
 */

namespace WpAxiom\Specifico;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Settings Rest Route Class
 */
class Specifico_Rest_Route {

	/**
	 * Initialize Settings Rest Route
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'create_rest_routes' ));
	}

	/**
	 * Init Rest Route
	 */
	public function create_rest_routes(): void {
		/**
		 * Specifications
		 */
		register_rest_route( 'specifico/v1', '/specification/select', [
			'methods'             => 'GET',
			'callback'            => [ $this, 'get_selected_specification' ],
			'permission_callback' => [ $this, 'get_permission_settings' ],
		] );

		register_rest_route( 'specifico/v1', '/specification', [
			'methods'             => 'GET',
			'callback'            => [ $this, 'get_specifications' ],
			'permission_callback' => [ $this, 'get_permission_settings' ],
		] );
		register_rest_route( 'specifico/v1', '/specification', [
			'methods'             => 'POST',
			'callback'            => [ $this, 'save_specification' ],
			'permission_callback' => [ $this, 'save_permission_settings' ],
		] );

		register_rest_route('specifico/v1', '/specification/(?P<id>\d+)', [
			'methods'             => 'GET',
			'callback'            => [ $this, 'get_specification' ],
			'permission_callback' => [ $this, 'get_permission_settings' ],
		] );
		register_rest_route('specifico/v1', '/specification/(?P<id>\d+)', [
			'methods'             => 'DELETE',
			'callback'            => [ $this, 'delete_specification' ],
			'permission_callback' => [ $this, 'delete_permission_settings' ],
		] );
		register_rest_route('specifico/v1', '/specification/(?P<id>\d+)', [
			'methods'             => 'PUT',
			'callback'            => [ $this, 'update_specification' ],
			'permission_callback' => [ $this, 'update_permission_settings' ],
		] );
		
		/**
		 * Groups
		 */

		register_rest_route( 'specifico/v1', '/groups/select', [
			'methods'             => 'GET',
			'callback'            => [ $this, 'get_selected_groups' ],
			'permission_callback' => [ $this, 'get_permission_settings' ],
		] );

		register_rest_route( 'specifico/v1', '/groups', [
			'methods'             => 'GET',
			'callback'            => [ $this, 'get_groups' ],
			'permission_callback' => [ $this, 'get_permission_settings' ],
		] );

		register_rest_route( 'specifico/v1', '/groups', [
			'methods'             => 'POST',
			'callback'            => [ $this, 'save_groups' ],
			'permission_callback' => [ $this, 'save_permission_settings' ],
		] );

		register_rest_route('specifico/v1', '/groups/(?P<id>\d+)', [
			'methods'             => 'GET',
			'callback'            => [ $this, 'get_group' ],
			'permission_callback' => [ $this, 'get_permission_settings' ],
		] );

		register_rest_route('specifico/v1', '/groups/(?P<id>\d+)', [
			'methods'             => 'DELETE',
			'callback'            => [ $this, 'delete_group' ],
			'permission_callback' => [ $this, 'delete_permission_settings' ],
		] );

		register_rest_route('specifico/v1', '/groups/(?P<id>\d+)', [
			'methods'             => 'PUT',
			'callback'            => [ $this, 'update_group' ],
			'permission_callback' => [ $this, 'update_permission_settings' ],
		] );

		/* Mapping */
		register_rest_route( 'specifico/v1', '/mapping', [
			'methods'             => 'GET',
			'callback'            => [ $this, 'get_mapping' ],
			'permission_callback' => [ $this, 'get_permission_settings' ],
		] );

		register_rest_route( 'specifico/v1', '/mapping', [
			'methods'             => 'PUT',
			'callback'            => [ $this, 'update_mapping' ],
			'permission_callback' => [ $this, 'update_permission_settings' ],
		] );

		register_rest_route( 'specifico/v1', '/categories', [
			'methods'             => 'GET',
			'callback'            => [ $this, 'get_product_categories' ],
			'permission_callback' => [ $this, 'get_permission_settings' ],
		] );

		register_rest_route( 'specifico/v1', '/tags', [
			'methods'             => 'GET',
			'callback'            => [ $this, 'get_product_tags' ],
			'permission_callback' => [ $this, 'get_permission_settings' ],
		] );


		/**
		 * Product Option
		 */

		register_rest_route( 'specifico/v1', '/option/(?P<id>\d+)', [
			'methods'             => 'GET',
			'callback'            => [ $this, 'get_product_option' ],
			'permission_callback' => [ $this, 'get_permission_settings' ],
		] );

		register_rest_route( 'specifico/v1', '/option/group/(?P<id>\d+)', [
			'methods'             => 'GET',
			'callback'            => [ $this, 'get_product_option_group' ],
			'permission_callback' => [ $this, 'get_permission_settings' ],
		] );

		register_rest_route( 'specifico/v1', '/option/group/(?P<id>\d+)', [
			'methods'             => 'DELETE',
			'callback'            => [ $this, 'delete_product_option_group' ],
			'permission_callback' => [ $this, 'get_permission_settings' ],
		] );

		/**
		 * Attributes
		 */

		register_rest_route( 'specifico/v1', '/attribute/(?P<id>\d+)', [
			'methods'             => 'GET',
			'callback'            => [ $this, 'get_product_attribute' ],
			'permission_callback' => [ $this, 'get_permission_settings' ],
		] );

		register_rest_route( 'specifico/v1', '/attribute/default/(?P<id>\d+)', [
			'methods'             => 'GET',
			'callback'            => [ $this, 'get_product_default_attribute' ],
			'permission_callback' => [ $this, 'get_permission_settings' ],
		] );

		/**
		 * settings
		 */
		register_rest_route( 'specifico/v1', '/settings', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_settings' ),
			'permission_callback' => array( $this, 'get_permission_settings' ),
		) );
		register_rest_route( 'specifico/v1', '/settings', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'save_settings' ),
			'permission_callback' => array( $this, 'save_permission_settings' ),
		) );
	}

	/**
	 * Save Route permission Settings
	 */
	public function save_permission_settings(): bool {
		return current_user_can( 'publish_posts' );
	}

	/**
	 * Get Route permission Settings
	 */
	public function get_permission_settings(): bool {
		return true;
	}

	/**
	 * Update Route permission Settings
	 */
	public function update_permission_settings():bool {
		return current_user_can( 'publish_posts' );
	}

	/**
	 * Delete Route permission Settings
	 */
	public function delete_permission_settings():bool {
		return current_user_can( 'delete_posts' );
	}

	/**
	 * Get Selected Specification tables
	 */
	public function get_selected_specification() {
		$args = [
			'post_type'   => 'specifico-table',
			'numberposts' => -1,
		];

		$specifications = get_posts( $args );

		$data_arr = [];

		$index = 0;
		foreach ( $specifications as $specification ) {
			$data_arr[ $index ]['value'] = $specification->ID;
			$data_arr[ $index ]['label'] = $specification->post_title;
			$index++;
		}

		return rest_ensure_response( $data_arr ) ;
	}

	/**
	 * Save Route Settings for specification table
	 */
	public function save_specification( $res ) {

		//return rest_ensure_response($res);
		$data = $res->get_json_params();
		$args = array(
			'post_title'  => $data['title'],
			'post_author' => get_current_user_id(),
			'post_status' => 'publish',
			'post_type'   => 'specifico-table',
		);

		if ( $data['meta'] ) {
			foreach ( $data['meta'] as $meta_key => $values ) {
				$args['meta_input'][ $meta_key ] = $values;
			}
		}

		$post_id = wp_insert_post( $args, true );

		$posts = get_posts(
			[
				'numberposts' => -1,
				'post_type'   => 'specifico-table',
				'fields'      => 'ids',
			]
		);

		update_option( '_specifico_tables', count($posts), true );

		return rest_ensure_response( $post_id );
	}

	/**
	 * Get Single specification
	 */
	public function get_specification( $res ) {
		$post = get_post( $res['id'] );

		if ( $post ) {
			$data = [];
			$data['id'] = $post->ID;
			$data['name'] = $post->post_title;
			$data['status'] = get_post_meta($post->ID, '_specifico_status', true) ? 1 : 0;

			$groups = get_post_meta($post->ID, '_specifico_groups', true);

			if ( $groups ) {
				$data['groups'] = $groups;
			}

			return rest_ensure_response( $data );
		}
	}

	/**
	 * Get Route Settings for specification table
	 */
	public function get_specifications() {
		$args = [
			'post_type'   => 'specifico-table',
			'numberposts' => -1,
			'meta_key'    => '_specifico_status',
		];

		$specs = get_posts( $args );

		$data_arr = [];

		$index = 0;
		foreach ( $specs as $spec ) {
			$data_arr[ $index ]['id'] = $spec->ID;
			$data_arr[ $index ]['name'] = $spec->post_title;
			$data_arr[ $index ]['status'] = (int) get_post_meta($spec->ID, '_specifico_status', true);
			$groups_arr = [];
			$groups = get_post_meta( $spec->ID, '_specifico_groups', true );

			if ( $groups ) {
				foreach ( $groups as $group ) {
					$groups_arr[] = $group['label'];
				}
			}

			$data_arr[ $index ]['groups'] = $groups_arr;
			$index++;
		}

		return rest_ensure_response( $data_arr ) ;
	}

	/**
	 * Update Route settings for specification table
	 */
	public function update_specification( $res ) {
		$data = $res->get_json_params();
		$args = array(
			'ID'          => $res['id'],
			'post_title'  => $data['title'],
			'post_author' => get_current_user_id(),
			'post_status' => 'publish',
			'post_type'   => 'specifico-table',
		);

		if ( $data['meta'] ) {
			foreach ( $data['meta'] as $meta_key => $values ) {
				$args['meta_input'][ $meta_key ] = $values;
			}
		}

		$post_id = wp_update_post( $args, true );

		return rest_ensure_response( $post_id );
	}

	/**
	 * Delete specification
	 */
	public function delete_specification( $res ) {
		$deleted_post = wp_delete_post( $res['id'], true);

		$tables = get_option( '_specifico_tables' );
		update_option( '_specifico_tables', ( $tables - 1 ), true );

		return rest_ensure_response( $deleted_post ) ;
	}

	/**
	 * Get all available groups for specification table
	 */
	public function get_selected_groups() {
		$args = [
			'post_type'   => 'specifico-groups',
			'numberposts' => -1,
		];

		$groups = get_posts( $args );

		$data_arr = [];

		$index = 0;
		foreach ( $groups as $group ) {
			$data_arr[ $index ]['value'] = $group->ID;
			$data_arr[ $index ]['label'] = $group->post_title;
			$index++;
		}

		return rest_ensure_response( $data_arr ) ;
	}

	/**
	 * Get Route Settings for Groups table
	 */
	public function get_groups() {
		$args = [
			'post_type'   => 'specifico-groups',
			'numberposts' => -1,
		];

		$groups = get_posts( $args );

		$data_arr = [];

		$index = 0;
		foreach ( $groups as $group ) {
			$data_arr[ $index ]['id'] = $group->ID;
			$data_arr[ $index ]['name'] = $group->post_title;
			$data_arr[ $index ]['slug'] = $group->post_name;
			$index++;
		}

		$posts = get_posts(
			[
				'numberposts' => -1,
				'post_type'   => 'specifico-groups',
				'fields'      => 'ids',
			]
		);

		update_option( '_specifico_groups', count($posts), true );

		return rest_ensure_response( $data_arr ) ;
	}

	/**
	 * Get Route Settings for single Group
	 */
	public function get_group( $res ) {
		$post = get_post( $res['id'] );

		if ( $post ) {
			$data = [];
			$data['id'] = $post->ID;
			$data['name'] = $post->post_title;
			$data['slug'] = $post->post_name;
			$data['attr'] = get_post_meta($post->ID, '_specifico_attr', true );

			return rest_ensure_response( $data );
		}
	}

	/**
	 * Save Route Settings for Groups table
	 */
	public function save_groups( $res ) {

		//return rest_ensure_response($res);
		$data = $res->get_json_params();
		$args = array(
			'post_title'  => $data['title'],
			'post_author' => get_current_user_id(),
			'post_status' => 'publish',
			'post_type'   => 'specifico-groups',
		);

		if ( $data['meta'] ) {
			foreach ( $data['meta'] as $meta_key => $values ) {
				$args['meta_input'][ $meta_key ] = $values;
			}
		}

		$post_id = wp_insert_post( $args, true );

		return rest_ensure_response( $post_id );
	}

	/**
	 * Update Route Settings for group table
	 */
	public function update_group( $res ) {

		$data = $res->get_json_params();
		$args = array(
			'ID'          => $res['id'],
			'post_title'  => $data['title'],
			'post_author' => get_current_user_id(),
			'post_status' => 'publish',
			'post_type'   => 'specifico-groups',
		);

		if ( $data['meta'] ) {
			foreach ( $data['meta'] as $meta_key => $values ) {
				$args['meta_input'][ $meta_key ] = $values;
			}
		}

		$post_id = wp_update_post( $args, true );

		return rest_ensure_response( $post_id );
	}

	/**
	 * delete Route Settings for single group
	 */
	public function delete_group( $res ) {
		$deleted_post = wp_delete_post( $res['id'], true);
		return rest_ensure_response( $deleted_post ) ;
	}

	/**
	 * Get mapping settings
	 */
	public function get_mapping() {
		$data = get_option( '_specifico_mapping' );
		if ( $data ) {
			return rest_ensure_response( $data );
		} else {
			return false;
		}
	}

	/**
	 * Update mapping settings
	 */
	public function update_mapping( $res ) {
		$data = $res->get_json_params();
		update_option( '_specifico_mapping', $data, true );
		return rest_ensure_response( 'mapping updated' );
	}

	/**
	 * Get Product Categories
	 */
	public function get_product_categories() {
		$args = [
			'taxonomy' => 'product_cat',
		];

		$terms = get_terms( $args );

		$categories = [];

		foreach ( $terms as $term ) {
			$categories[] = [
				'label' => $term->name,
				'value' => $term->term_id,
			];
		}

		return rest_ensure_response( $categories );
	}

	/**
	 * Get Product Categories
	 */
	public function get_product_tags() {
		$args = [
			'taxonomy' => 'product_tag',
		];

		$terms = get_terms( $args );

		$tags = [];

		if ( $terms ) {
			foreach ( $terms as $term ) {
				$tags[] = [
					'label' => $term->name,
					'value' => $term->term_id,
				];
			}
		}

		return rest_ensure_response( $tags );
	}

	public function get_product_option( $res ) {
		$product_id = (int) $res['id'];

		$override = get_post_meta( $product_id, '_specifico_override', true );
		$groups   = get_post_meta( $product_id, '_specifico_groups', true );

		$inherit_values = get_post_meta( $product_id, '_specifico_inherit_values', true );

		$data = [
			'id'             => $product_id,
			'spec'           => 'yes' === get_post_meta( $product_id, '_specifico_spec', true ) ? 1 : 0,
			'override'       => 'custom' === $override ? 'custom' : '',
			'groups'         => is_array( $groups ) ? $groups : [],
			'inherit_values' => is_array( $inherit_values ) ? $inherit_values : [],
		];

		// Resolve what the mapping would show for this product, regardless of
		// override mode. The metabox always shows the inherited preview so the
		// merchant sees what they'd get if they unchecked Custom.
		$match = Mapping_Resolver::resolve( $product_id );

		$data['inherited'] = $match
			? [
				'table_id'    => $match['table_id'],
				'table_name'  => $match['table_name'],
				'match_type'  => $match['match_type'],
				'match_value' => $match['match_value'],
				'groups'      => Mapping_Resolver::get_table_groups( $match['table_id'] ),
			]
			: null;

		return rest_ensure_response( $data );
	}

	public function get_product_option_group( $res ) {
		$post_id = $res['id'];

		if ( $post_id && get_post_meta( $post_id, '_specifico_groups', true ) ) {
			$data = true;
		} else {
			$data = false;
		}

		return rest_ensure_response( $data );
	}

	public function delete_product_option_group( $res ) {
		$post_id = $res['id'];

		if ( $post_id ) {
			delete_post_meta( $post_id, '_specifico_groups' );
			delete_post_meta( $post_id, '_specifico_table' );
			update_post_meta( $post_id, '_specifico_spec', 0 );
			update_post_meta( $post_id, '_specifico_type', array(
				'label' => 'Default',
				'value' => 'default',
			) );
		}

		return rest_ensure_response( 'Group deleted successfully' );
	}

	public function get_product_attribute( $res ) {
		$data = Mapping_Resolver::get_table_groups( (int) $res['id'] );
		return rest_ensure_response( $data );
	}

	public function get_product_default_attribute( $res ) {
		$product_id = (int) $res['id'];
		if ( ! $product_id ) {
			return rest_ensure_response( [] );
		}

		$groups = Mapping_Resolver::resolve_groups( $product_id );
		return rest_ensure_response( $groups );
	}

	/**
	 * Get Options Settings
	 */
	public function get_settings() {
		return rest_ensure_response( get_option('_specifico_settings') );
	}

	/**
	 * Save Options Settings
	 */
	public function save_settings( $res ) {

		$data = $res->get_json_params();
		update_option('_specifico_settings', $data);
		return rest_ensure_response( 'settings updated successfully' );
	}
}

// End of file Specifico_Rest_Route.php.
