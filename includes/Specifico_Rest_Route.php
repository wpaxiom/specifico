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
			'permission_callback' => [ $this, 'can_manage_products' ],
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
			'permission_callback' => [ $this, 'can_edit_product_meta' ],
		] );

		register_rest_route( 'specifico/v1', '/option/group/(?P<id>\d+)', [
			'methods'             => 'GET',
			'callback'            => [ $this, 'get_product_option_group' ],
			'permission_callback' => [ $this, 'can_edit_product_meta' ],
		] );

		register_rest_route( 'specifico/v1', '/option/group/(?P<id>\d+)', [
			'methods'             => 'DELETE',
			'callback'            => [ $this, 'delete_product_option_group' ],
			'permission_callback' => [ $this, 'can_edit_product_meta' ],
		] );

		/**
		 * Attributes
		 */

		register_rest_route( 'specifico/v1', '/attribute/(?P<id>\d+)', [
			'methods'             => 'GET',
			'callback'            => [ $this, 'get_product_attribute' ],
			'permission_callback' => [ $this, 'can_manage_products' ],
		] );

		register_rest_route( 'specifico/v1', '/attribute/default/(?P<id>\d+)', [
			'methods'             => 'GET',
			'callback'            => [ $this, 'get_product_default_attribute' ],
			'permission_callback' => [ $this, 'can_edit_product_meta' ],
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

		/**
		 * Import / Export
		 */
		register_rest_route( 'specifico/v1', '/export', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'export_data' ),
			'permission_callback' => array( $this, 'get_permission_settings' ),
		) );
		register_rest_route( 'specifico/v1', '/import', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'import_data' ),
			'permission_callback' => array( $this, 'save_permission_settings' ),
		) );
		register_rest_route( 'specifico/v1', '/import/prepare', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'prepare_import_data' ),
			'permission_callback' => array( $this, 'save_permission_settings' ),
		) );
		register_rest_route( 'specifico/v1', '/import/step', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'step_import_data' ),
			'permission_callback' => array( $this, 'save_permission_settings' ),
		) );
	}

	/**
	 * Permission check for reading Specifico data.
	 *
	 * All REST routes serve the authenticated React admin (the storefront table
	 * is server-rendered in Frontend\Tab, not via REST), and several endpoints
	 * expose internal plugin configuration, so reads require admin access too.
	 */
	public function get_permission_settings(): bool {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Permission check for creating Specifico data.
	 */
	public function save_permission_settings(): bool {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Permission check for updating Specifico data.
	 */
	public function update_permission_settings(): bool {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Permission check for deleting Specifico data.
	 */
	public function delete_permission_settings(): bool {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Permission check for product-scoped routes whose {id} is a product.
	 *
	 * These power the "Specification Settings" metabox on the WooCommerce
	 * product editor, so the check is object-specific: the user must be able to
	 * edit that exact product. This intentionally allows Shop Managers (who can
	 * edit products) without requiring full `manage_options` access.
	 */
	public function can_edit_product_meta( $request ): bool {
		return current_user_can( 'edit_post', (int) $request['id'] );
	}

	/**
	 * Permission check for product-area routes that read shared specification
	 * data (the {id}, when present, is a spec table, not a product). Available
	 * to any role that can edit products, e.g. the metabox and Mapping screen.
	 */
	public function can_manage_products(): bool {
		return current_user_can( 'edit_products' );
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
	public function get_specifications( $request ) {
		$per_page = isset( $request['per_page'] ) ? max( 1, (int) $request['per_page'] ) : 10;
		$page     = isset( $request['page'] ) ? max( 1, (int) $request['page'] ) : 1;
		$search   = isset( $request['search'] ) ? sanitize_text_field( $request['search'] ) : '';

		$args = [
			'post_type'      => 'specifico-table',
			'posts_per_page' => $per_page,
			'paged'          => $page,
			'orderby'        => 'date',
			'order'          => 'DESC',
			'meta_key'       => '_specifico_status', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- Admin-only listing of specification tables.
		];

		if ( '' !== $search ) {
			$args['s'] = $search;
		}

		$query = new \WP_Query( $args );

		$data_arr = [];

		$index = 0;
		foreach ( $query->posts as $spec ) {
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

		return rest_ensure_response(
			[
				'rows'  => $data_arr,
				'total' => (int) $query->found_posts,
			]
		);
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

		// Recount the actual published tables rather than decrementing, so the
		// cached count can't drift out of sync with reality (mirrors groups).
		$posts = get_posts(
			[
				'numberposts' => -1,
				'post_type'   => 'specifico-table',
				'fields'      => 'ids',
			]
		);
		update_option( '_specifico_tables', count( $posts ), true );

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
	public function get_groups( $request ) {
		$per_page = isset( $request['per_page'] ) ? max( 1, (int) $request['per_page'] ) : 10;
		$page     = isset( $request['page'] ) ? max( 1, (int) $request['page'] ) : 1;
		$search   = isset( $request['search'] ) ? sanitize_text_field( $request['search'] ) : '';

		$args = [
			'post_type'      => 'specifico-groups',
			'posts_per_page' => $per_page,
			'paged'          => $page,
			'orderby'        => 'date',
			'order'          => 'DESC',
		];

		if ( '' !== $search ) {
			$args['s'] = $search;
		}

		$query = new \WP_Query( $args );

		$data_arr = [];

		$index = 0;
		foreach ( $query->posts as $group ) {
			$data_arr[ $index ]['id'] = $group->ID;
			$data_arr[ $index ]['name'] = $group->post_title;
			$data_arr[ $index ]['slug'] = $group->post_name;
			$index++;
		}

		return rest_ensure_response(
			[
				'rows'  => $data_arr,
				'total' => (int) $query->found_posts,
			]
		);
	}

	/**
	 * Recount published group posts and store the total in the
	 * `_specifico_groups` option used by the admin menu.
	 */
	private function refresh_groups_count(): void {
		$posts = get_posts(
			[
				'numberposts' => -1,
				'post_type'   => 'specifico-groups',
				'fields'      => 'ids',
			]
		);

		update_option( '_specifico_groups', count( $posts ), true );
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

		$this->refresh_groups_count();

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

		$this->refresh_groups_count();

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

		if ( is_array( $data ) ) {
			if ( isset( $data['tab_title'] ) ) {
				$data['tab_title'] = sanitize_text_field( $data['tab_title'] );
			}
			if ( isset( $data['wc_additional_info'] ) ) {
				$allowed                    = [ 'keep', 'remove', 'remove_if_specs' ];
				$data['wc_additional_info'] = in_array( $data['wc_additional_info'], $allowed, true ) ? $data['wc_additional_info'] : 'keep';
			}
		}

		update_option('_specifico_settings', $data);
		return rest_ensure_response( 'settings updated successfully' );
	}

	/**
	 * Export all Specifico data as a portable JSON envelope.
	 */
	public function export_data( $request ) {
		$include_products = '0' !== (string) $request->get_param( 'include_products' );

		return rest_ensure_response( Import_Export::build_export( $include_products ) );
	}

	/**
	 * Import an uploaded JSON file (Specifico or competitor format, auto-detected).
	 *
	 * `mode=detect` returns a dry-run summary (counts only, no writes); any other
	 * value applies the import.
	 */
	public function import_data( $request ) {
		$data = $this->read_uploaded_json( $request );
		if ( is_wp_error( $data ) ) {
			return $data;
		}

		$dry_run = 'detect' === (string) $request->get_param( 'mode' );

		// Block concurrent (apply) imports; detection is read-only.
		if ( ! $dry_run ) {
			if ( get_transient( 'specifico_importing' ) ) {
				return new \WP_Error( 'specifico_busy', __( 'Another import is already in progress.', 'specifico' ), array( 'status' => 409 ) );
			}
			set_transient( 'specifico_importing', 1, 30 * MINUTE_IN_SECONDS );
		}

		$summary = Import_Export::import( $data, $dry_run );

		if ( ! $dry_run ) {
			delete_transient( 'specifico_importing' );
		}

		return rest_ensure_response( $summary );
	}

	/**
	 * Begin a chunked import: validate the upload, normalize it, and return a
	 * session id + totals. The actual writing happens in import_step().
	 */
	public function prepare_import_data( $request ) {
		$data = $this->read_uploaded_json( $request );
		if ( is_wp_error( $data ) ) {
			return $data;
		}

		$result = Import_Export::prepare_import( $data );

		if ( isset( $result['error'] ) ) {
			return new \WP_Error( 'specifico_import_error', $result['error'], array( 'status' => 400 ) );
		}

		return rest_ensure_response( $result );
	}

	/**
	 * Process the next batch of a prepared import and return its progress.
	 */
	public function step_import_data( $request ) {
		$session = sanitize_text_field( (string) $request->get_param( 'session' ) );

		if ( '' === $session ) {
			return new \WP_Error( 'specifico_no_session', __( 'Missing import session.', 'specifico' ), array( 'status' => 400 ) );
		}

		return rest_ensure_response( Import_Export::step_import( $session ) );
	}

	/**
	 * Read and JSON-decode an uploaded file from a REST request.
	 *
	 * @return array|\WP_Error Decoded array, or an error response.
	 */
	private function read_uploaded_json( $request ) {
		$files = $request->get_file_params();
		$file  = $files['file'] ?? null;

		if ( empty( $file ) || empty( $file['tmp_name'] ) || ! empty( $file['error'] ) ) {
			return new \WP_Error( 'specifico_no_file', __( 'No file was uploaded.', 'specifico' ), array( 'status' => 400 ) );
		}

		if ( (int) $file['size'] <= 0 || (int) $file['size'] > 20 * MB_IN_BYTES ) {
			return new \WP_Error( 'specifico_bad_size', __( 'The file is empty or too large.', 'specifico' ), array( 'status' => 400 ) );
		}

		$contents = file_get_contents( $file['tmp_name'] ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Reading an uploaded temp file.
		$data     = json_decode( $contents, true );

		if ( JSON_ERROR_NONE !== json_last_error() || ! is_array( $data ) ) {
			return new \WP_Error( 'specifico_bad_json', __( 'The file is not valid JSON.', 'specifico' ), array( 'status' => 400 ) );
		}

		return $data;
	}
}

// End of file Specifico_Rest_Route.php.
