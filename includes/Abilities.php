<?php
/**
 * AI agent tools.
 *
 * Registers Specifico's operations as WordPress Abilities (core since 6.9) so
 * AI agents can read and manage specification tables. Transport is not ours:
 * the official MCP Adapter plugin serves these abilities, both on its default
 * server and on a dedicated `/wp-json/mcp/specifico` server registered here.
 *
 * Off by default. Nothing registers until a merchant turns on "Allow AI agents"
 * in Specifico Settings, and every ability checks the same capability as the
 * matching `specifico/v1` REST route.
 *
 * @package specifico
 */

namespace WpAxiom\Specifico;

use WP_Error;
use WP_REST_Request;

if ( ! defined( 'ABSPATH' ) ) exit;

class Abilities {

	/**
	 * Ability category slug.
	 */
	const CATEGORY = 'specifico';

	/**
	 * MCP server route: served at /wp-json/mcp/specifico.
	 */
	const SERVER_NAMESPACE = 'mcp';
	const SERVER_ROUTE     = 'specifico';

	/**
	 * REST controller whose callbacks do the actual writes, so agent writes
	 * behave exactly like admin writes (sanitizing, counts, row IDs).
	 *
	 * @var Specifico_Rest_Route|null
	 */
	private static $rest = null;

	/**
	 * Registered ability names, used for the dedicated MCP server.
	 *
	 * @var string[]
	 */
	private static $names = [];

	/**
	 * Hook everything up. Safe to call on any WordPress version.
	 *
	 * @param Specifico_Rest_Route $rest Shared REST controller instance.
	 */
	public static function init( Specifico_Rest_Route $rest ) {
		self::$rest = $rest;

		if ( ! self::is_supported() || ! self::is_enabled() ) {
			return;
		}

		add_action( 'wp_abilities_api_categories_init', [ __CLASS__, 'register_category' ] );
		add_action( 'wp_abilities_api_init', [ __CLASS__, 'register_abilities' ] );
		add_action( 'mcp_adapter_init', [ __CLASS__, 'register_server' ] );
	}

	/**
	 * Whether this WordPress has the Abilities API (6.9+).
	 */
	public static function is_supported() {
		return function_exists( 'wp_register_ability' ) && function_exists( 'wp_register_ability_category' );
	}

	/**
	 * Whether the merchant turned on "Allow AI agents".
	 */
	public static function is_enabled() {
		$settings = get_option( '_specifico_settings' );
		$enabled  = is_array( $settings ) && ! empty( $settings['ai_agents'] );

		/**
		 * Filters whether Specifico registers its AI agent abilities.
		 *
		 * @since 1.0.10
		 *
		 * @param bool $enabled Value of the "Allow AI agents" setting.
		 */
		return (bool) apply_filters( 'specifico_ai_agents_enabled', $enabled );
	}

	/**
	 * Whether the official MCP Adapter is loaded.
	 */
	public static function adapter_active() {
		return class_exists( '\WP\MCP\Core\McpAdapter' );
	}

	/**
	 * Plugin file of the installed MCP Adapter (active or not), e.g.
	 * "mcp-adapter/mcp-adapter.php". Empty string when it isn't installed.
	 */
	public static function adapter_plugin_file() {
		static $file = null;
		if ( null !== $file ) {
			return $file;
		}

		$file = '';
		if ( ! function_exists( 'get_plugins' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		foreach ( get_plugins() as $plugin_file => $data ) {
			if ( 'mcp-adapter/mcp-adapter.php' === $plugin_file || ( isset( $data['Name'] ) && 'MCP Adapter' === $data['Name'] ) ) {
				$file = $plugin_file;
				break;
			}
		}
		return $file;
	}

	/**
	 * URL of the dedicated Specifico MCP server.
	 */
	public static function server_url() {
		return rest_url( self::SERVER_NAMESPACE . '/' . self::SERVER_ROUTE );
	}

	/**
	 * Register the "Specifico" ability category.
	 */
	public static function register_category() {
		wp_register_ability_category(
			self::CATEGORY,
			[
				'label'       => __( 'Specifico', 'specifico' ),
				'description' => __( 'Create and manage WooCommerce product specification tables.', 'specifico' ),
			]
		);
	}

	/**
	 * Register a dedicated MCP server that lists only Specifico's tools.
	 *
	 * @param object $adapter \WP\MCP\Core\McpAdapter instance.
	 */
	public static function register_server( $adapter ) {
		if ( ! is_object( $adapter ) || ! method_exists( $adapter, 'create_server' ) ) {
			return;
		}

		// Reading the registry fires wp_abilities_api_init if it has not run yet.
		if ( empty( self::$names ) && function_exists( 'wp_get_abilities' ) ) {
			wp_get_abilities();
		}

		if ( empty( self::$names ) ) {
			return;
		}

		$transport = '\WP\MCP\Transport\HttpTransport';
		if ( ! class_exists( $transport ) ) {
			return;
		}

		$error_handler = class_exists( '\WP\MCP\Infrastructure\ErrorHandling\ErrorLogMcpErrorHandler' )
			? '\WP\MCP\Infrastructure\ErrorHandling\ErrorLogMcpErrorHandler'
			: null;

		try {
			$result = $adapter->create_server(
				'specifico',
				self::SERVER_NAMESPACE,
				self::SERVER_ROUTE,
				__( 'Specifico', 'specifico' ),
				__( 'Create and manage WooCommerce product specification tables, groups, mapping rules and product values.', 'specifico' ),
				defined( 'SPECIFICO_VERSION' ) ? SPECIFICO_VERSION : '1.0.0',
				[ $transport ],
				$error_handler,
				null,
				self::$names,
				[],
				[]
			);

			if ( is_wp_error( $result ) ) {
				self::log( 'MCP server registration failed: ' . $result->get_error_message() );
			}
		} catch ( \Throwable $e ) {
			// An older Adapter copy bundled by another plugin may use a different
			// signature. The abilities still work on the default server.
			self::log( 'MCP server registration failed: ' . $e->getMessage() );
		}
	}

	/**
	 * Register every Specifico ability.
	 */
	public static function register_abilities() {
		$read    = [ 'readonly' => true, 'destructive' => false, 'idempotent' => true ];
		$write   = [ 'readonly' => false, 'destructive' => false, 'idempotent' => false ];
		$destroy = [ 'readonly' => false, 'destructive' => true, 'idempotent' => false ];

		$manage  = [ __CLASS__, 'can_manage' ];
		$product = [ __CLASS__, 'can_edit_product' ];

		$dry_run = [
			'type'        => 'boolean',
			'default'     => false,
			'description' => 'Preview the change without saving it. Use this first and show the user the result before applying.',
		];

		$page_props = [
			'search'   => [ 'type' => 'string', 'description' => 'Optional search text.' ],
			'page'     => [ 'type' => 'integer', 'minimum' => 1, 'default' => 1 ],
			'per_page' => [ 'type' => 'integer', 'minimum' => 1, 'maximum' => 100, 'default' => 50 ],
		];

		$id_or_name = [
			'type'        => [ 'integer', 'string' ],
			'description' => 'Numeric ID or exact name.',
		];

		// ---- Read -------------------------------------------------------

		self::add(
			'list-tables',
			__( 'List specification tables', 'specifico' ),
			'List Specifico specification tables with the attribute groups each one contains.',
			self::object_schema( $page_props ),
			[ __CLASS__, 'list_tables' ],
			$manage,
			$read
		);

		self::add(
			'get-table',
			__( 'Get a specification table', 'specifico' ),
			'Get one specification table with its groups and every row (label and default value). Row keys identify rows for set-product-specs.',
			self::object_schema( [ 'table_id' => [ 'type' => 'integer', 'description' => 'Table ID.' ] ], [ 'table_id' ] ),
			[ __CLASS__, 'get_table' ],
			$manage,
			$read
		);

		self::add(
			'list-groups',
			__( 'List attribute groups', 'specifico' ),
			'List reusable attribute groups (for example "Display" or "Battery"). Groups hold rows and are combined into tables.',
			self::object_schema( $page_props ),
			[ __CLASS__, 'list_groups' ],
			$manage,
			$read
		);

		self::add(
			'get-group',
			__( 'Get an attribute group', 'specifico' ),
			'Get one attribute group with its rows. Each row has a stable id used by update-group.',
			self::object_schema( [ 'group_id' => [ 'type' => 'integer', 'description' => 'Group ID.' ] ], [ 'group_id' ] ),
			[ __CLASS__, 'get_group' ],
			$manage,
			$read
		);

		self::add(
			'find-groups',
			__( 'Find matching groups', 'specifico' ),
			'Before creating groups, check which existing groups already contain given attribute names, so you reuse them instead of creating duplicates. Matching ignores case and extra spaces.',
			self::object_schema(
				[
					'attribute_names' => [
						'type'        => 'array',
						'items'       => [ 'type' => 'string' ],
						'minItems'    => 1,
						'maxItems'    => 200,
						'description' => 'Attribute names to look for, for example ["Screen size", "Battery capacity"].',
					],
				],
				[ 'attribute_names' ]
			),
			[ __CLASS__, 'find_groups' ],
			$manage,
			$read
		);

		self::add(
			'get-mapping',
			__( 'Get mapping rules', 'specifico' ),
			'List the rules that assign tables to products by category, tag or product. Rules are checked in order and the first match wins.',
			self::object_schema( [] ),
			[ __CLASS__, 'get_mapping' ],
			$manage,
			$read
		);

		self::add(
			'get-product-specs',
			__( 'Get a product\'s specifications', 'specifico' ),
			'Get the specifications a product shows: whether the tab is enabled, whether it inherits a mapped table or has its own custom table, and every row with its key, label and value.',
			self::object_schema( [ 'product_id' => [ 'type' => 'integer', 'description' => 'WooCommerce product ID.' ] ], [ 'product_id' ] ),
			[ __CLASS__, 'get_product_specs' ],
			$product,
			$read
		);

		self::add(
			'export',
			__( 'Export Specifico data', 'specifico' ),
			'Export groups, tables and mapping rules as Specifico JSON, optionally with per-product values.',
			self::object_schema( [ 'include_products' => [ 'type' => 'boolean', 'default' => false ] ] ),
			[ __CLASS__, 'export' ],
			$manage,
			$read
		);

		self::add(
			'find-products',
			__( 'Find products', 'specifico' ),
			'Find WooCommerce products by name or SKU, category, tag or product type. Returns each product\'s ID (needed by get-product-specs and set-product-specs), SKU, type, whether its Specifications tab is on, inherit or custom mode, and the table its mapping rules assign.',
			self::object_schema(
				[
					'search'   => [ 'type' => 'string', 'description' => 'Words from the product name, or an exact SKU.' ],
					'category' => [ 'type' => [ 'integer', 'string' ], 'description' => 'Product category ID, slug or exact name. Includes subcategories.' ],
					'tag'      => [ 'type' => [ 'integer', 'string' ], 'description' => 'Product tag ID, slug or exact name.' ],
					'type'     => [ 'type' => 'string', 'enum' => [ 'simple', 'variable', 'grouped', 'external' ] ],
					'page'     => [ 'type' => 'integer', 'minimum' => 1, 'default' => 1 ],
					'per_page' => [ 'type' => 'integer', 'minimum' => 1, 'maximum' => 100, 'default' => 20 ],
				]
			),
			[ __CLASS__, 'find_products' ],
			[ __CLASS__, 'can_list_products' ],
			$read
		);

		// ---- Write ------------------------------------------------------

		$row_input = [
			'type'                 => 'object',
			'properties'           => [
				'name'  => [ 'type' => 'string', 'minLength' => 1 ],
				'value' => [ 'type' => 'string', 'description' => 'Default value shown on products that inherit the table.' ],
			],
			'required'             => [ 'name' ],
			'additionalProperties' => false,
		];

		self::add(
			'create-group',
			__( 'Create an attribute group', 'specifico' ),
			'Create a reusable attribute group with rows. Fails if a group with the same name exists; use find-groups first and update-group to change an existing one.',
			self::object_schema(
				[
					'name'    => [ 'type' => 'string', 'minLength' => 1 ],
					'rows'    => [ 'type' => 'array', 'items' => $row_input, 'default' => [] ],
					'dry_run' => $dry_run,
				],
				[ 'name' ]
			),
			[ __CLASS__, 'create_group' ],
			$manage,
			$write
		);

		self::add(
			'update-group',
			__( 'Update an attribute group', 'specifico' ),
			'Rename a group, append rows, edit rows by id, or remove rows by id. Appending and editing are safe. Removing a row shifts the saved product values of later rows in tables that use this group, so preview with dry_run first.',
			self::object_schema(
				[
					'group_id'       => [ 'type' => 'integer' ],
					'name'           => [ 'type' => 'string', 'minLength' => 1 ],
					'add_rows'       => [ 'type' => 'array', 'items' => $row_input ],
					'update_rows'    => [
						'type'  => 'array',
						'items' => [
							'type'                 => 'object',
							'properties'           => [
								'id'    => [ 'type' => 'string', 'minLength' => 1 ],
								'name'  => [ 'type' => 'string', 'minLength' => 1 ],
								'value' => [ 'type' => 'string' ],
							],
							'required'             => [ 'id' ],
							'additionalProperties' => false,
						],
					],
					'remove_row_ids' => [ 'type' => 'array', 'items' => [ 'type' => 'string' ] ],
					'dry_run'        => $dry_run,
				],
				[ 'group_id' ]
			),
			[ __CLASS__, 'update_group' ],
			$manage,
			$write
		);

		self::add(
			'create-table',
			__( 'Create a specification table', 'specifico' ),
			'Create a specification table from existing groups, in the order given. Fails if a table with the same name exists.',
			self::object_schema(
				[
					'name'    => [ 'type' => 'string', 'minLength' => 1 ],
					'groups'  => [ 'type' => 'array', 'items' => $id_or_name, 'minItems' => 1 ],
					'enabled' => [ 'type' => 'boolean', 'default' => true ],
					'dry_run' => $dry_run,
				],
				[ 'name', 'groups' ]
			),
			[ __CLASS__, 'create_table' ],
			$manage,
			$write
		);

		self::add(
			'update-table',
			__( 'Update a specification table', 'specifico' ),
			'Rename a table, replace its group list, or enable/disable it. Products store inherited values by group position, so changing the order of existing groups moves their saved values; preview with dry_run first.',
			self::object_schema(
				[
					'table_id' => [ 'type' => 'integer' ],
					'name'     => [ 'type' => 'string', 'minLength' => 1 ],
					'groups'   => [ 'type' => 'array', 'items' => $id_or_name, 'minItems' => 1 ],
					'enabled'  => [ 'type' => 'boolean' ],
					'dry_run'  => $dry_run,
				],
				[ 'table_id' ]
			),
			[ __CLASS__, 'update_table' ],
			$manage,
			$write
		);

		self::add(
			'add-mapping-rule',
			__( 'Add a mapping rule', 'specifico' ),
			'Assign a table to products by category, tag or individual product. Values can be IDs, slugs or exact names (products also match by SKU). Rules are checked in order and the first match wins; use position "start" to give the rule priority.',
			self::object_schema(
				[
					'table_id' => [ 'type' => 'integer' ],
					'type'     => [ 'type' => 'string', 'enum' => [ 'category', 'tag', 'product' ] ],
					'values'   => [ 'type' => 'array', 'items' => [ 'type' => [ 'integer', 'string' ] ], 'minItems' => 1 ],
					'position' => [ 'type' => 'string', 'enum' => [ 'start', 'end' ], 'default' => 'end' ],
					'dry_run'  => $dry_run,
				],
				[ 'table_id', 'type', 'values' ]
			),
			[ __CLASS__, 'add_mapping_rule' ],
			$manage,
			$write
		);

		self::add(
			'move-mapping-rule',
			__( 'Move a mapping rule', 'specifico' ),
			'Change a mapping rule\'s priority by moving it to another position. Rules are checked in order and the first match wins, so index 0 has the highest priority. Pass table_id as well so the call fails safely if the rules changed since you read them.',
			self::object_schema(
				[
					'rule_index' => [ 'type' => 'integer', 'minimum' => 0, 'description' => 'Current index from get-mapping.' ],
					'to_index'   => [ 'type' => 'integer', 'minimum' => 0, 'description' => 'New index. 0 is the highest priority; an index past the end moves the rule to the end.' ],
					'table_id'   => [ 'type' => 'integer', 'description' => 'Expected table of that rule, as a safety check.' ],
					'dry_run'    => $dry_run,
				],
				[ 'rule_index', 'to_index' ]
			),
			[ __CLASS__, 'move_mapping_rule' ],
			$manage,
			$write
		);

		$value_items = [
			'type'  => 'array',
			'items' => [
				'type'                 => 'object',
				'properties'           => [
					'key'   => [ 'type' => 'string' ],
					'group' => [ 'type' => 'string' ],
					'label' => [ 'type' => 'string' ],
					'value' => [ 'type' => 'string' ],
				],
				'required'             => [ 'value' ],
				'additionalProperties' => false,
			],
		];

		$specs_props = [
			'product_id' => [ 'type' => 'integer' ],
			'enabled'    => [ 'type' => 'boolean', 'description' => 'Show or hide the Specifications tab on this product.' ],
			'mode'       => [ 'type' => 'string', 'enum' => [ 'inherit', 'custom' ] ],
			'values'     => $value_items,
			'groups'     => [
				'type'  => 'array',
				'items' => [
					'type'                 => 'object',
					'properties'           => [
						'title' => [ 'type' => 'string' ],
						'rows'  => [
							'type'  => 'array',
							'items' => [
								'type'                 => 'object',
								'properties'           => [
									'label' => [ 'type' => 'string', 'minLength' => 1 ],
									'value' => [ 'type' => 'string' ],
								],
								'required'             => [ 'label' ],
								'additionalProperties' => false,
							],
						],
					],
					'required'             => [ 'title', 'rows' ],
					'additionalProperties' => false,
				],
			],
			'variations' => [
				'type'        => 'array',
				'description' => 'Variable products only. Values one variation shows in place of the product value. Address rows like "values"; an empty value makes the variation show the product value again.',
				'items'       => [
					'type'                 => 'object',
					'properties'           => [
						'variation' => [ 'type' => [ 'integer', 'string' ], 'description' => 'Variation ID or SKU.' ],
						'values'    => $value_items,
					],
					'required'             => [ 'variation', 'values' ],
					'additionalProperties' => false,
				],
			],
		];

		self::add(
			'set-product-specs',
			__( 'Set a product\'s specifications', 'specifico' ),
			'Change one product\'s specifications. In "inherit" mode the product uses its mapped table and "values" overrides individual row values (address rows by key from get-product-specs, or by group and label; an empty value restores the table default). In "custom" mode the product has its own table: pass "groups" to replace it, or "values" to edit rows. Switching to custom without groups copies the current inherited table. For variable products, "variations" sets values that only one variation shows. To change many products, use set-product-specs-bulk.',
			self::object_schema(
				array_merge( $specs_props, [ 'dry_run' => $dry_run ] ),
				[ 'product_id' ]
			),
			[ __CLASS__, 'set_product_specs' ],
			$product,
			$write
		);

		self::add(
			'set-product-specs-bulk',
			__( 'Set specifications for several products', 'specifico' ),
			'Change the specifications of up to 50 products in one call. Each item takes the same fields as set-product-specs. Every item is checked first; if any item fails, nothing is saved and the errors are returned. Preview with dry_run first.',
			self::object_schema(
				[
					'products' => [
						'type'     => 'array',
						'minItems' => 1,
						'maxItems' => 50,
						'items'    => [
							'type'                 => 'object',
							'properties'           => $specs_props,
							'required'             => [ 'product_id' ],
							'additionalProperties' => false,
						],
					],
					'dry_run'  => $dry_run,
				],
				[ 'products' ]
			),
			[ __CLASS__, 'set_product_specs_bulk' ],
			[ __CLASS__, 'can_edit_products' ],
			$write
		);

		// ---- Destructive ------------------------------------------------

		self::add(
			'remove-mapping-rule',
			__( 'Remove a mapping rule', 'specifico' ),
			'Remove one mapping rule by its index from get-mapping. Pass table_id as well so the call fails safely if the rules changed since you read them.',
			self::object_schema(
				[
					'rule_index' => [ 'type' => 'integer', 'minimum' => 0 ],
					'table_id'   => [ 'type' => 'integer', 'description' => 'Expected table of that rule, as a safety check.' ],
					'dry_run'    => $dry_run,
				],
				[ 'rule_index' ]
			),
			[ __CLASS__, 'remove_mapping_rule' ],
			$manage,
			$destroy
		);

		self::add(
			'delete-table',
			__( 'Delete a specification table', 'specifico' ),
			'Permanently delete a specification table. Mapping rules that point at it are removed too. Products with their own custom tables are not affected.',
			self::object_schema(
				[
					'table_id' => [ 'type' => 'integer' ],
					'dry_run'  => $dry_run,
				],
				[ 'table_id' ]
			),
			[ __CLASS__, 'delete_table' ],
			$manage,
			$destroy
		);

		self::add(
			'delete-group',
			__( 'Delete an attribute group', 'specifico' ),
			'Permanently delete an attribute group. If tables use it, the call fails unless detach_from_tables is true, which also removes the group from those tables.',
			self::object_schema(
				[
					'group_id'           => [ 'type' => 'integer' ],
					'detach_from_tables' => [ 'type' => 'boolean', 'default' => false ],
					'dry_run'            => $dry_run,
				],
				[ 'group_id' ]
			),
			[ __CLASS__, 'delete_group' ],
			$manage,
			$destroy
		);

		self::add(
			'import',
			__( 'Import Specifico data', 'specifico' ),
			'Import a Specifico JSON export (or a "Product Specifications for WooCommerce" export). Existing groups and tables with the same slug are updated. Site settings in the file are ignored.',
			self::object_schema(
				[
					'data'    => [ 'type' => 'object', 'description' => 'The decoded export file.' ],
					'dry_run' => $dry_run,
				],
				[ 'data' ]
			),
			[ __CLASS__, 'import' ],
			$manage,
			$destroy
		);
	}

	// ====================================================================
	// Permissions
	// ====================================================================

	/**
	 * Shared Specifico data needs the same capability as the admin screens.
	 */
	public static function can_manage() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Product data needs permission to edit that product, like the metabox.
	 *
	 * @param mixed $input Ability input.
	 */
	public static function can_edit_product( $input = null ) {
		$product_id = is_array( $input ) ? (int) ( $input['product_id'] ?? 0 ) : 0;

		if ( ! $product_id || 'product' !== get_post_type( $product_id ) ) {
			// Let execute() report the bad ID; deny only on missing capability.
			return current_user_can( 'edit_products' );
		}

		return current_user_can( 'edit_post', $product_id );
	}

	/**
	 * Listing products needs the general product editing capability.
	 */
	public static function can_list_products() {
		return current_user_can( 'edit_products' );
	}

	/**
	 * Bulk product writes need permission to edit every product in the list.
	 *
	 * @param mixed $input Ability input.
	 */
	public static function can_edit_products( $input = null ) {
		if ( ! current_user_can( 'edit_products' ) ) {
			return false;
		}

		$items = is_array( $input ) ? (array) ( $input['products'] ?? [] ) : [];
		foreach ( $items as $item ) {
			$product_id = is_array( $item ) ? (int) ( $item['product_id'] ?? 0 ) : 0;
			// Bad IDs are reported by execute(); deny only on missing capability.
			if ( $product_id && 'product' === get_post_type( $product_id ) && ! current_user_can( 'edit_post', $product_id ) ) {
				return false;
			}
		}

		return true;
	}

	// ====================================================================
	// Read
	// ====================================================================

	/**
	 * @param array $input Input.
	 */
	public static function list_tables( $input = [] ) {
		$query = self::paged_query( 'specifico-table', (array) $input );

		return [
			'tables' => array_map( [ __CLASS__, 'table_summary' ], $query->posts ),
			'total'  => (int) $query->found_posts,
		];
	}

	/**
	 * @param array $input Input.
	 */
	public static function get_table( $input ) {
		$table = self::get_table_post( $input['table_id'] ?? 0 );
		if ( is_wp_error( $table ) ) {
			return $table;
		}

		$data           = self::table_summary( $table );
		$data['groups'] = self::groups_to_output( Mapping_Resolver::get_table_groups( $table->ID ) );

		return $data;
	}

	/**
	 * @param array $input Input.
	 */
	public static function list_groups( $input = [] ) {
		$query  = self::paged_query( 'specifico-groups', (array) $input );
		$groups = [];

		foreach ( $query->posts as $post ) {
			$groups[] = [
				'id'        => $post->ID,
				'name'      => $post->post_title,
				'row_count' => count( self::group_rows( $post->ID ) ),
			];
		}

		return [
			'groups' => $groups,
			'total'  => (int) $query->found_posts,
		];
	}

	/**
	 * @param array $input Input.
	 */
	public static function get_group( $input ) {
		$group = self::get_group_post( $input['group_id'] ?? 0 );
		if ( is_wp_error( $group ) ) {
			return $group;
		}

		return self::group_detail( $group );
	}

	/**
	 * @param array $input Input.
	 */
	public static function find_groups( $input ) {
		$wanted = [];
		foreach ( (array) ( $input['attribute_names'] ?? [] ) as $name ) {
			$norm = self::normalize( $name );
			if ( '' !== $norm ) {
				$wanted[ $norm ] = (string) $name;
			}
		}

		$found   = [];
		$matches = [];
		$groups  = get_posts( [ 'post_type' => 'specifico-groups', 'numberposts' => -1 ] );

		foreach ( $groups as $group ) {
			$matched = [];
			$rows    = self::group_rows( $group->ID );

			foreach ( $rows as $row ) {
				$norm = self::normalize( $row['name'] );
				if ( isset( $wanted[ $norm ] ) ) {
					$matched[]      = $row['name'];
					$found[ $norm ] = true;
				}
			}

			if ( $matched ) {
				$matches[] = [
					'id'          => $group->ID,
					'name'        => $group->post_title,
					'row_count'   => count( $rows ),
					'match_count' => count( $matched ),
					'matched'     => $matched,
				];
			}
		}

		usort(
			$matches,
			static function ( $a, $b ) {
				return $b['match_count'] <=> $a['match_count'];
			}
		);

		return [
			'groups'    => $matches,
			'unmatched' => array_values( array_diff_key( $wanted, $found ) ),
		];
	}

	/**
	 * @param array $input Input.
	 */
	public static function get_mapping( $input = [] ) {
		$rules = [];

		foreach ( self::mapping_rules() as $index => $rule ) {
			$table_id = (int) ( $rule['category']['value'] ?? 0 );
			$values   = [];

			foreach ( (array) ( $rule['values'] ?? [] ) as $value ) {
				$values[] = [
					'id'    => (int) ( $value['value'] ?? 0 ),
					'label' => (string) ( $value['label'] ?? '' ),
				];
			}

			$rules[] = [
				'index'        => $index,
				'type'         => self::friendly_rule_type( $rule['type']['value'] ?? '' ),
				'table_id'     => $table_id,
				'table_name'   => $table_id ? get_the_title( $table_id ) : '',
				'table_exists' => $table_id && 'specifico-table' === get_post_type( $table_id ),
				'values'       => $values,
			];
		}

		return [ 'rules' => $rules ];
	}

	/**
	 * @param array $input Input.
	 */
	public static function get_product_specs( $input ) {
		$product = self::get_product_post( $input['product_id'] ?? 0 );
		if ( is_wp_error( $product ) ) {
			return $product;
		}

		return self::product_state( $product->ID );
	}

	/**
	 * @param array $input Input.
	 */
	public static function find_products( $input = [] ) {
		$input    = (array) $input;
		$per_page = max( 1, min( 100, (int) ( $input['per_page'] ?? 20 ) ) );
		$page     = max( 1, (int) ( $input['page'] ?? 1 ) );

		$args = [
			'post_type'      => 'product',
			'post_status'    => [ 'publish', 'draft', 'pending', 'private', 'future' ],
			'posts_per_page' => $per_page,
			'paged'          => $page,
			'orderby'        => 'title',
			'order'          => 'ASC',
			'fields'         => 'ids',
		];

		$tax_query = [];
		foreach ( [ 'category' => 'product_cat', 'tag' => 'product_tag' ] as $key => $taxonomy ) {
			if ( ! isset( $input[ $key ] ) || '' === $input[ $key ] ) {
				continue;
			}
			$term = self::resolve_term_value( $input[ $key ], $taxonomy );
			if ( ! $term ) {
				return new WP_Error( 'specifico_unknown_term', sprintf( 'No product %s matches "%s".', $key, $input[ $key ] ) );
			}
			$tax_query[] = [
				'taxonomy' => $taxonomy,
				'field'    => 'term_id',
				'terms'    => [ $term['value'] ],
			];
		}
		if ( ! empty( $input['type'] ) ) {
			$tax_query[] = [
				'taxonomy' => 'product_type',
				'field'    => 'slug',
				'terms'    => [ sanitize_key( (string) $input['type'] ) ],
			];
		}
		if ( $tax_query ) {
			$args['tax_query'] = array_merge( [ 'relation' => 'AND' ], $tax_query ); // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query
		}

		$search = trim( (string) ( $input['search'] ?? '' ) );
		$sku_id = 0;
		if ( '' !== $search ) {
			$args['s'] = sanitize_text_field( $search );

			// WordPress search covers titles and content, not SKUs. An exact
			// SKU match goes first (a variation SKU finds its parent product).
			if ( ! $tax_query && function_exists( 'wc_get_product_id_by_sku' ) ) {
				$sku_id = (int) wc_get_product_id_by_sku( $search );
				if ( $sku_id && 'product_variation' === get_post_type( $sku_id ) ) {
					$sku_id = (int) wp_get_post_parent_id( $sku_id );
				}
				if ( $sku_id && 'product' !== get_post_type( $sku_id ) ) {
					$sku_id = 0;
				}
			}
		}

		$query = new \WP_Query( $args );
		$ids   = array_map( 'intval', $query->posts );
		$total = (int) $query->found_posts;

		if ( $sku_id && ! in_array( $sku_id, $ids, true ) ) {
			$total++;
			if ( 1 === $page ) {
				array_unshift( $ids, $sku_id );
			}
		}

		$products = [];
		foreach ( $ids as $id ) {
			$products[] = self::product_summary( $id );
		}

		return [
			'products' => $products,
			'total'    => $total,
			'page'     => $page,
			'pages'    => (int) ceil( $total / $per_page ),
		];
	}

	/**
	 * @param array $input Input.
	 */
	public static function export( $input = [] ) {
		$data = Import_Export::build_export( ! empty( $input['include_products'] ) );
		unset( $data['settings'] );

		return $data;
	}

	// ====================================================================
	// Write
	// ====================================================================

	/**
	 * @param array $input Input.
	 */
	public static function create_group( $input ) {
		$name = trim( (string) $input['name'] );

		$existing = self::find_post_by_title( 'specifico-groups', $name );
		if ( $existing ) {
			return new WP_Error(
				'specifico_group_exists',
				sprintf( 'A group named "%s" already exists (id %d). Use update-group to change it.', $existing->post_title, $existing->ID )
			);
		}

		$rows = [];
		foreach ( (array) ( $input['rows'] ?? [] ) as $row ) {
			$rows[] = self::attr_row( '', $row['name'], $row['value'] ?? '' );
		}

		$preview = [
			'dry_run' => ! empty( $input['dry_run'] ),
			'name'    => $name,
			'rows'    => self::attrs_to_rows( $rows ),
		];

		if ( $preview['dry_run'] ) {
			return $preview;
		}

		$id = self::rest_call(
			'save_groups',
			[
				'title' => $name,
				'meta'  => [ '_specifico_attr' => $rows ],
			]
		);

		if ( is_wp_error( $id ) ) {
			return $id;
		}

		return self::group_detail( get_post( $id ) );
	}

	/**
	 * @param array $input Input.
	 */
	public static function update_group( $input ) {
		$group = self::get_group_post( $input['group_id'] ?? 0 );
		if ( is_wp_error( $group ) ) {
			return $group;
		}

		$name = isset( $input['name'] ) ? trim( (string) $input['name'] ) : $group->post_title;
		if ( 0 !== strcasecmp( $name, $group->post_title ) ) {
			$clash = self::find_post_by_title( 'specifico-groups', $name );
			if ( $clash && $clash->ID !== $group->ID ) {
				return new WP_Error( 'specifico_group_exists', sprintf( 'Another group is already named "%s" (id %d).', $clash->post_title, $clash->ID ) );
			}
		}

		$attrs   = self::group_attrs( $group->ID );
		$by_id   = [];
		$changes = [];
		$errors  = [];

		foreach ( $attrs as $index => $attr ) {
			$by_id[ $attr['id'] ] = $index;
		}

		foreach ( (array) ( $input['update_rows'] ?? [] ) as $update ) {
			$id = sanitize_key( (string) $update['id'] );
			if ( ! isset( $by_id[ $id ] ) ) {
				$errors[] = sprintf( 'Row id "%s" is not in this group.', $id );
				continue;
			}
			$i = $by_id[ $id ];
			if ( isset( $update['name'] ) ) {
				$changes[]                  = sprintf( 'Rename row "%s" to "%s"', $attrs[ $i ]['attributeName'], $update['name'] );
				$attrs[ $i ]['attributeName'] = $update['name'];
			}
			if ( isset( $update['value'] ) ) {
				$changes[]                   = sprintf( 'Set "%s" default value to "%s"', $attrs[ $i ]['attributeName'], $update['value'] );
				$attrs[ $i ]['attributeValue'] = $update['value'];
			}
		}

		$warnings = [];
		$remove   = array_map( 'sanitize_key', array_map( 'strval', (array) ( $input['remove_row_ids'] ?? [] ) ) );
		foreach ( $remove as $id ) {
			if ( ! isset( $by_id[ $id ] ) ) {
				$errors[] = sprintf( 'Row id "%s" is not in this group.', $id );
			}
		}

		if ( $errors ) {
			return new WP_Error( 'specifico_invalid_rows', implode( ' ', $errors ) );
		}

		if ( $remove ) {
			$kept = [];
			foreach ( $attrs as $attr ) {
				if ( in_array( $attr['id'], $remove, true ) ) {
					$changes[] = sprintf( 'Remove row "%s"', $attr['attributeName'] );
					continue;
				}
				$kept[] = $attr;
			}
			$attrs = $kept;

			$tables = self::tables_using_group( $group->ID );
			if ( $tables ) {
				$warnings[] = sprintf(
					'Tables using this group: %s. Products that inherit these tables store values by row position, so values saved for rows after a removed row move up by one.',
					implode( ', ', wp_list_pluck( $tables, 'name' ) )
				);
			}
		}

		foreach ( (array) ( $input['add_rows'] ?? [] ) as $row ) {
			$changes[] = sprintf( 'Add row "%s"', $row['name'] );
			$attrs[]   = self::attr_row( '', $row['name'], $row['value'] ?? '' );
		}

		if ( $name !== $group->post_title ) {
			array_unshift( $changes, sprintf( 'Rename group "%s" to "%s"', $group->post_title, $name ) );
		}

		$result = [
			'dry_run'  => ! empty( $input['dry_run'] ),
			'group_id' => $group->ID,
			'changes'  => $changes,
			'warnings' => $warnings,
		];

		if ( $result['dry_run'] ) {
			$result['rows'] = self::attrs_to_rows( $attrs );
			return $result;
		}

		$saved = self::rest_call(
			'update_group',
			[
				'title' => $name,
				'meta'  => [ '_specifico_attr' => array_values( $attrs ) ],
			],
			$group->ID
		);

		if ( is_wp_error( $saved ) ) {
			return $saved;
		}

		return array_merge( $result, self::group_detail( get_post( $group->ID ) ) );
	}

	/**
	 * @param array $input Input.
	 */
	public static function create_table( $input ) {
		$name = trim( (string) $input['name'] );

		$existing = self::find_post_by_title( 'specifico-table', $name );
		if ( $existing ) {
			return new WP_Error(
				'specifico_table_exists',
				sprintf( 'A table named "%s" already exists (id %d). Use update-table to change it.', $existing->post_title, $existing->ID )
			);
		}

		$groups = self::resolve_groups( (array) $input['groups'] );
		if ( is_wp_error( $groups ) ) {
			return $groups;
		}

		$enabled = ! isset( $input['enabled'] ) || ! empty( $input['enabled'] );

		$preview = [
			'dry_run' => ! empty( $input['dry_run'] ),
			'name'    => $name,
			'enabled' => $enabled,
			'groups'  => self::table_groups_output( $groups ),
		];

		if ( $preview['dry_run'] ) {
			return $preview;
		}

		$id = self::rest_call(
			'save_specification',
			[
				'title' => $name,
				'meta'  => [
					'_specifico_status' => $enabled ? 1 : 0,
					'_specifico_groups' => $groups,
				],
			]
		);

		if ( is_wp_error( $id ) ) {
			return $id;
		}

		return self::get_table( [ 'table_id' => $id ] );
	}

	/**
	 * @param array $input Input.
	 */
	public static function update_table( $input ) {
		$table = self::get_table_post( $input['table_id'] ?? 0 );
		if ( is_wp_error( $table ) ) {
			return $table;
		}

		$name = isset( $input['name'] ) ? trim( (string) $input['name'] ) : $table->post_title;
		if ( 0 !== strcasecmp( $name, $table->post_title ) ) {
			$clash = self::find_post_by_title( 'specifico-table', $name );
			if ( $clash && $clash->ID !== $table->ID ) {
				return new WP_Error( 'specifico_table_exists', sprintf( 'Another table is already named "%s" (id %d).', $clash->post_title, $clash->ID ) );
			}
		}

		$current = get_post_meta( $table->ID, '_specifico_groups', true );
		$current = is_array( $current ) ? array_values( $current ) : [];
		$groups  = $current;

		if ( isset( $input['groups'] ) ) {
			$groups = self::resolve_groups( (array) $input['groups'] );
			if ( is_wp_error( $groups ) ) {
				return $groups;
			}
		}

		$enabled  = isset( $input['enabled'] ) ? (bool) $input['enabled'] : (bool) get_post_meta( $table->ID, '_specifico_status', true );
		$changes  = [];
		$warnings = [];

		if ( $name !== $table->post_title ) {
			$changes[] = sprintf( 'Rename table "%s" to "%s"', $table->post_title, $name );
		}
		if ( $enabled !== (bool) get_post_meta( $table->ID, '_specifico_status', true ) ) {
			$changes[] = $enabled ? 'Enable table' : 'Disable table';
		}

		$old_ids = array_map( 'intval', wp_list_pluck( $current, 'value' ) );
		$new_ids = array_map( 'intval', wp_list_pluck( $groups, 'value' ) );
		if ( $old_ids !== $new_ids ) {
			$changes[] = sprintf(
				'Change groups from [%s] to [%s]',
				implode( ', ', wp_list_pluck( $current, 'label' ) ),
				implode( ', ', wp_list_pluck( $groups, 'label' ) )
			);

			foreach ( $old_ids as $position => $group_id ) {
				if ( ( $new_ids[ $position ] ?? null ) !== $group_id ) {
					$warnings[] = 'Existing groups change position. Products that inherit this table store values by group position, so their saved values follow the position, not the group.';
					break;
				}
			}
		}

		$result = [
			'dry_run'  => ! empty( $input['dry_run'] ),
			'table_id' => $table->ID,
			'changes'  => $changes,
			'warnings' => $warnings,
		];

		if ( $result['dry_run'] ) {
			$result['groups'] = self::table_groups_output( $groups );
			return $result;
		}

		$saved = self::rest_call(
			'update_specification',
			[
				'title' => $name,
				'meta'  => [
					'_specifico_status' => $enabled ? 1 : 0,
					'_specifico_groups' => $groups,
				],
			],
			$table->ID
		);

		if ( is_wp_error( $saved ) ) {
			return $saved;
		}

		return array_merge( $result, self::get_table( [ 'table_id' => $table->ID ] ) );
	}

	/**
	 * @param array $input Input.
	 */
	public static function add_mapping_rule( $input ) {
		$table = self::get_table_post( $input['table_id'] ?? 0 );
		if ( is_wp_error( $table ) ) {
			return $table;
		}

		$type_map = [
			'category' => [ 'product-category', __( 'Product Category', 'specifico' ) ],
			'tag'      => [ 'product-tag', __( 'Product Tag', 'specifico' ) ],
			'product'  => [ 'product-name', __( 'Product Name', 'specifico' ) ],
		];
		$type     = (string) $input['type'];

		if ( ! isset( $type_map[ $type ] ) ) {
			return new WP_Error( 'specifico_invalid_type', 'Type must be category, tag or product.' );
		}

		$values = [];
		$errors = [];
		foreach ( (array) $input['values'] as $raw ) {
			$resolved = 'product' === $type
				? self::resolve_product_value( $raw )
				: self::resolve_term_value( $raw, 'category' === $type ? 'product_cat' : 'product_tag' );

			if ( null === $resolved ) {
				$errors[] = (string) $raw;
				continue;
			}
			$values[] = $resolved;
		}

		if ( $errors ) {
			return new WP_Error( 'specifico_unresolved_values', sprintf( 'Could not find these %s values: %s', $type, implode( ', ', $errors ) ) );
		}

		$rule = [
			'type'     => [
				'value' => $type_map[ $type ][0],
				'label' => $type_map[ $type ][1],
			],
			'category' => [
				'value' => $table->ID,
				'label' => $table->post_title,
			],
			'values'   => $values,
		];

		$rules = self::mapping_rules();
		$start = 'start' === ( $input['position'] ?? 'end' );

		if ( $start ) {
			array_unshift( $rules, $rule );
		} else {
			$rules[] = $rule;
		}

		$result = [
			'dry_run'    => ! empty( $input['dry_run'] ),
			'rule_index' => $start ? 0 : count( $rules ) - 1,
			'table'      => $table->post_title,
			'type'       => $type,
			'values'     => wp_list_pluck( $values, 'label' ),
		];

		if ( $result['dry_run'] ) {
			return $result;
		}

		$saved = self::rest_call( 'update_mapping', $rules );
		if ( is_wp_error( $saved ) ) {
			return $saved;
		}

		return array_merge( $result, self::get_mapping() );
	}

	/**
	 * @param array $input Input.
	 */
	public static function set_product_specs( $input ) {
		$product = self::get_product_post( $input['product_id'] ?? 0 );
		if ( is_wp_error( $product ) ) {
			return $product;
		}

		$product_id   = $product->ID;
		$current_mode = 'custom' === get_post_meta( $product_id, '_specifico_override', true ) ? 'custom' : 'inherit';
		$mode         = isset( $input['mode'] ) ? (string) $input['mode'] : $current_mode;
		$values       = (array) ( $input['values'] ?? [] );
		$changes      = [];

		if ( isset( $input['groups'] ) && 'custom' !== $mode ) {
			return new WP_Error( 'specifico_groups_need_custom', 'Pass mode "custom" together with groups.' );
		}

		if ( 'inherit' === $mode ) {
			$match = Mapping_Resolver::resolve( $product_id );
			if ( ! $match ) {
				return new WP_Error(
					'specifico_no_mapped_table',
					'No mapping rule assigns a table to this product. Add a mapping rule, or use mode "custom".'
				);
			}

			$table_groups = Mapping_Resolver::get_table_groups( $match['table_id'] );
			$inherit      = $current_mode === $mode ? get_post_meta( $product_id, '_specifico_inherit_values', true ) : [];
			$inherit      = is_array( $inherit ) ? $inherit : [];

			$positions = self::locate_rows( $table_groups, $values );
			if ( is_wp_error( $positions ) ) {
				return $positions;
			}

			foreach ( $positions as $i => $pos ) {
				list( $gi, $ri ) = $pos;
				$value          = (string) $values[ $i ]['value'];
				$label          = $table_groups[ $gi ]['inputGroups'][ $ri ][0]['value'] ?? '';
				$before         = $inherit[ $gi ][ $ri ] ?? ( $table_groups[ $gi ]['inputGroups'][ $ri ][1]['value'] ?? '' );

				if ( '' === $value ) {
					unset( $inherit[ $gi ][ $ri ] );
					$changes[] = sprintf( 'Restore table default for "%s"', $label );
				} else {
					$inherit[ $gi ][ $ri ] = $value;
					$changes[]             = sprintf( 'Set "%s" from "%s" to "%s"', $label, $before, $value );
				}
			}

			$inherit = array_filter( $inherit );
			if ( 'custom' === $current_mode ) {
				array_unshift( $changes, sprintf( 'Switch from a custom table to the mapped table "%s"', $match['table_name'] ) );
			}
		} else {
			if ( isset( $input['groups'] ) ) {
				$groups    = self::custom_groups_from_input( (array) $input['groups'], $product_id );
				$changes[] = 'Replace the custom table';
			} elseif ( 'custom' === $current_mode ) {
				$groups = get_post_meta( $product_id, '_specifico_groups', true );
				$groups = is_array( $groups ) ? array_values( $groups ) : [];
			} else {
				// Copy what the product shows now, without the automatic variation rows.
				$groups = array_values(
					array_filter(
						Mapping_Resolver::resolve_product_groups( $product_id ),
						static function ( $group ) {
							return empty( $group['auto'] );
						}
					)
				);
				$changes[] = 'Switch to a custom table, starting from the current inherited values';
			}

			$positions = self::locate_rows( $groups, $values );
			if ( is_wp_error( $positions ) ) {
				return $positions;
			}

			foreach ( $positions as $i => $pos ) {
				list( $gi, $ri ) = $pos;
				$label          = $groups[ $gi ]['inputGroups'][ $ri ][0]['value'] ?? '';
				$before         = $groups[ $gi ]['inputGroups'][ $ri ][1]['value'] ?? '';
				$value          = (string) $values[ $i ]['value'];

				$groups[ $gi ]['inputGroups'][ $ri ][1] = [ 'id' => 2, 'value' => $value ];
				$changes[]                              = sprintf( 'Set "%s" from "%s" to "%s"', $label, $before, $value );
			}

			$groups = Admin\Product_Data::sanitize_groups( $groups );
		}

		// Per-variation values, keyed by stable row key so they survive edits.
		$var_values = null;
		if ( ! empty( $input['variations'] ) ) {
			$var_values = self::apply_variation_input(
				$product_id,
				'custom' === $mode ? $groups : $table_groups,
				(array) $input['variations'],
				$changes
			);
			if ( is_wp_error( $var_values ) ) {
				return $var_values;
			}
		}

		$was_enabled = 'yes' === get_post_meta( $product_id, '_specifico_spec', true );
		$enabled     = isset( $input['enabled'] ) ? (bool) $input['enabled'] : $was_enabled;
		if ( $enabled !== $was_enabled ) {
			$changes[] = $enabled ? 'Show the Specifications tab' : 'Hide the Specifications tab';
		}

		$warnings = [];
		if ( ! $enabled ) {
			$warnings[] = 'The Specifications tab is hidden on this product. Pass enabled true to show it.';
		}

		$result = [
			'dry_run'    => ! empty( $input['dry_run'] ),
			'product_id' => $product_id,
			'mode'       => $mode,
			'enabled'    => $enabled,
			'changes'    => $changes,
			'warnings'   => $warnings,
		];

		if ( $result['dry_run'] ) {
			if ( 'custom' === $mode ) {
				$result['groups'] = self::groups_to_output( $groups );
			}
			return $result;
		}

		update_post_meta( $product_id, '_specifico_spec', $enabled ? 'yes' : 'no' );

		if ( 'custom' === $mode ) {
			update_post_meta( $product_id, '_specifico_override', 'custom' );
			update_post_meta( $product_id, '_specifico_groups', $groups );
			delete_post_meta( $product_id, '_specifico_inherit_values' );
		} else {
			update_post_meta( $product_id, '_specifico_override', '' );
			delete_post_meta( $product_id, '_specifico_groups' );
			if ( $inherit ) {
				update_post_meta( $product_id, '_specifico_inherit_values', Admin\Product_Data::sanitize_inherit_values( $inherit ) );
			} else {
				delete_post_meta( $product_id, '_specifico_inherit_values' );
			}
		}

		// Sanitize against the groups just saved, the same way the metabox does.
		if ( null !== $var_values ) {
			$clean = Admin\Product_Data::sanitize_var_values( $var_values, $product_id );
			if ( $clean ) {
				update_post_meta( $product_id, '_specifico_var_values', $clean );
			} else {
				delete_post_meta( $product_id, '_specifico_var_values' );
			}
		}

		return array_merge( $result, self::product_state( $product_id ) );
	}

	/**
	 * Several products in one call. Every item is previewed first; nothing is
	 * saved unless all of them pass.
	 *
	 * @param array $input Input.
	 */
	public static function set_product_specs_bulk( $input ) {
		$items   = array_values( (array) ( $input['products'] ?? [] ) );
		$dry_run = ! empty( $input['dry_run'] );
		$plans   = [];
		$errors  = [];
		$seen    = [];

		foreach ( $items as $index => $item ) {
			$item       = (array) $item;
			$product_id = (int) ( $item['product_id'] ?? 0 );

			if ( isset( $seen[ $product_id ] ) ) {
				$errors[] = [
					'index'      => $index,
					'product_id' => $product_id,
					'error'      => 'This product is listed more than once. Combine its changes into one item.',
				];
				continue;
			}
			$seen[ $product_id ] = true;

			$item['dry_run'] = true;
			$preview         = self::set_product_specs( $item );

			if ( is_wp_error( $preview ) ) {
				$errors[] = [
					'index'      => $index,
					'product_id' => $product_id,
					'error'      => $preview->get_error_message(),
				];
				continue;
			}

			$plans[] = self::bulk_item_output( $preview );
		}

		if ( $errors ) {
			return new WP_Error(
				'specifico_bulk_invalid',
				'Nothing was saved. Fix these products and call again: ' . wp_json_encode( $errors )
			);
		}

		if ( $dry_run ) {
			return [
				'dry_run'  => true,
				'products' => $plans,
			];
		}

		$saved  = [];
		$failed = [];
		foreach ( $items as $index => $item ) {
			$item            = (array) $item;
			$item['dry_run'] = false;
			$result          = self::set_product_specs( $item );

			if ( is_wp_error( $result ) ) {
				$failed[] = [
					'index'      => $index,
					'product_id' => (int) ( $item['product_id'] ?? 0 ),
					'error'      => $result->get_error_message(),
				];
				continue;
			}

			$saved[] = self::bulk_item_output( $result );
		}

		return [
			'dry_run'  => false,
			'saved'    => count( $saved ),
			'products' => $saved,
			'failed'   => $failed,
		];
	}

	/**
	 * @param array $input Input.
	 */
	public static function move_mapping_rule( $input ) {
		$rules = self::mapping_rules();
		$from  = (int) $input['rule_index'];

		if ( ! isset( $rules[ $from ] ) ) {
			return new WP_Error( 'specifico_no_rule', sprintf( 'There is no mapping rule at index %d. Call get-mapping for the current rules.', $from ) );
		}

		$table_id = (int) ( $rules[ $from ]['category']['value'] ?? 0 );
		if ( isset( $input['table_id'] ) && (int) $input['table_id'] !== $table_id ) {
			return new WP_Error( 'specifico_rule_changed', sprintf( 'Rule %d points at table %d, not %d. The rules changed; call get-mapping again.', $from, $table_id, (int) $input['table_id'] ) );
		}

		$to = max( 0, min( count( $rules ) - 1, (int) $input['to_index'] ) );

		$rule = $rules[ $from ];
		array_splice( $rules, $from, 1 );
		array_splice( $rules, $to, 0, [ $rule ] );

		$result = [
			'dry_run'    => ! empty( $input['dry_run'] ),
			'from_index' => $from,
			'to_index'   => $to,
			'table'      => $table_id ? get_the_title( $table_id ) : '',
			'changes'    => $from === $to ? [] : [ sprintf( 'Move rule %d to position %d', $from, $to ) ],
		];

		if ( $result['dry_run'] || $from === $to ) {
			return $result;
		}

		$saved = self::rest_call( 'update_mapping', $rules );
		if ( is_wp_error( $saved ) ) {
			return $saved;
		}

		return array_merge( $result, self::get_mapping() );
	}

	// ====================================================================
	// Destructive
	// ====================================================================

	/**
	 * @param array $input Input.
	 */
	public static function remove_mapping_rule( $input ) {
		$rules = self::mapping_rules();
		$index = (int) $input['rule_index'];

		if ( ! isset( $rules[ $index ] ) ) {
			return new WP_Error( 'specifico_no_rule', sprintf( 'There is no mapping rule at index %d. Call get-mapping for the current rules.', $index ) );
		}

		$table_id = (int) ( $rules[ $index ]['category']['value'] ?? 0 );
		if ( isset( $input['table_id'] ) && (int) $input['table_id'] !== $table_id ) {
			return new WP_Error( 'specifico_rule_changed', sprintf( 'Rule %d points at table %d, not %d. The rules changed; call get-mapping again.', $index, $table_id, (int) $input['table_id'] ) );
		}

		$removed = self::get_mapping()['rules'][ $index ];
		array_splice( $rules, $index, 1 );

		$result = [
			'dry_run' => ! empty( $input['dry_run'] ),
			'removed' => $removed,
		];

		if ( $result['dry_run'] ) {
			return $result;
		}

		$saved = self::rest_call( 'update_mapping', $rules );
		if ( is_wp_error( $saved ) ) {
			return $saved;
		}

		return array_merge( $result, self::get_mapping() );
	}

	/**
	 * @param array $input Input.
	 */
	public static function delete_table( $input ) {
		$table = self::get_table_post( $input['table_id'] ?? 0 );
		if ( is_wp_error( $table ) ) {
			return $table;
		}

		$rules   = self::mapping_rules();
		$kept    = [];
		$dropped = 0;

		foreach ( $rules as $rule ) {
			if ( (int) ( $rule['category']['value'] ?? 0 ) === $table->ID ) {
				$dropped++;
				continue;
			}
			$kept[] = $rule;
		}

		$result = [
			'dry_run'               => ! empty( $input['dry_run'] ),
			'table_id'              => $table->ID,
			'name'                  => $table->post_title,
			'mapping_rules_removed' => $dropped,
		];

		if ( $result['dry_run'] ) {
			return $result;
		}

		if ( $dropped ) {
			$saved = self::rest_call( 'update_mapping', $kept );
			if ( is_wp_error( $saved ) ) {
				return $saved;
			}
		}

		$deleted = self::rest_call( 'delete_specification', [], $table->ID );
		if ( is_wp_error( $deleted ) ) {
			return $deleted;
		}

		$result['deleted'] = true;

		return $result;
	}

	/**
	 * @param array $input Input.
	 */
	public static function delete_group( $input ) {
		$group = self::get_group_post( $input['group_id'] ?? 0 );
		if ( is_wp_error( $group ) ) {
			return $group;
		}

		$tables = self::tables_using_group( $group->ID );

		if ( $tables && empty( $input['detach_from_tables'] ) ) {
			return new WP_Error(
				'specifico_group_in_use',
				sprintf(
					'Group "%s" is used by these tables: %s. Pass detach_from_tables true to remove it from them and delete it.',
					$group->post_title,
					implode( ', ', wp_list_pluck( $tables, 'name' ) )
				)
			);
		}

		$result = [
			'dry_run'         => ! empty( $input['dry_run'] ),
			'group_id'        => $group->ID,
			'name'            => $group->post_title,
			'detached_tables' => $tables,
			'warnings'        => $tables ? [ 'Products that inherit these tables store values by group position, so values of later groups move up by one.' ] : [],
		];

		if ( $result['dry_run'] ) {
			return $result;
		}

		foreach ( $tables as $table ) {
			$groups = get_post_meta( $table['id'], '_specifico_groups', true );
			$groups = array_values(
				array_filter(
					(array) $groups,
					static function ( $item ) use ( $group ) {
						return (int) ( $item['value'] ?? 0 ) !== $group->ID;
					}
				)
			);
			update_post_meta( $table['id'], '_specifico_groups', $groups );
		}

		$deleted = self::rest_call( 'delete_group', [], $group->ID );
		if ( is_wp_error( $deleted ) ) {
			return $deleted;
		}

		$result['deleted'] = true;

		return $result;
	}

	/**
	 * @param array $input Input.
	 */
	public static function import( $input ) {
		$data = is_array( $input['data'] ?? null ) ? $input['data'] : [];

		// Agents manage specification data, not site settings (and not this toggle).
		unset( $data['settings'] );

		return Import_Export::import( $data, ! empty( $input['dry_run'] ) );
	}

	// ====================================================================
	// Helpers
	// ====================================================================

	/**
	 * Register one ability under the specifico/ namespace.
	 */
	private static function add( $slug, $label, $description, $input_schema, $execute, $permission, $annotations ) {
		$name = 'specifico/' . $slug;

		$ability = wp_register_ability(
			$name,
			[
				'label'               => $label,
				'description'         => $description,
				'category'            => self::CATEGORY,
				'input_schema'        => $input_schema,
				'execute_callback'    => $execute,
				'permission_callback' => $permission,
				'meta'                => [
					'annotations'  => $annotations,
					'show_in_rest' => true,
					'mcp'          => [
						'public' => true,
						'type'   => 'tool',
					],
				],
			]
		);

		if ( $ability ) {
			self::$names[] = $name;
		}
	}

	/**
	 * Object input schema. Optional-only schemas default to {} so the ability
	 * can be called without input.
	 */
	private static function object_schema( array $properties, array $required = [] ) {
		$schema = [
			'type'                 => 'object',
			'additionalProperties' => false,
		];

		if ( $properties ) {
			$schema['properties'] = $properties;
		}

		if ( $required ) {
			$schema['required'] = $required;
		} else {
			$schema['default'] = [];
		}

		return $schema;
	}

	/**
	 * Call a Specifico_Rest_Route callback with a JSON body, the way the admin does.
	 *
	 * @param string   $method Callback method name.
	 * @param array    $body   JSON body.
	 * @param int|null $id     URL id parameter.
	 * @return mixed|WP_Error Response data.
	 */
	private static function rest_call( $method, array $body = [], $id = null ) {
		if ( ! self::$rest || ! method_exists( self::$rest, $method ) ) {
			return new WP_Error( 'specifico_internal', 'Specifico is not fully loaded.' );
		}

		$request = new WP_REST_Request( 'POST' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( $body ) );
		if ( null !== $id ) {
			$request->set_url_params( [ 'id' => (int) $id ] );
		}

		$response = call_user_func( [ self::$rest, $method ], $request );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return $response instanceof \WP_REST_Response ? $response->get_data() : $response;
	}

	/**
	 * Paged query for tables or groups.
	 */
	private static function paged_query( $post_type, array $input ) {
		$args = [
			'post_type'      => $post_type,
			'post_status'    => 'publish',
			'posts_per_page' => max( 1, min( 100, (int) ( $input['per_page'] ?? 50 ) ) ),
			'paged'          => max( 1, (int) ( $input['page'] ?? 1 ) ),
			'orderby'        => 'title',
			'order'          => 'ASC',
		];

		if ( ! empty( $input['search'] ) ) {
			$args['s'] = sanitize_text_field( (string) $input['search'] );
		}

		return new \WP_Query( $args );
	}

	private static function get_table_post( $id ) {
		$post = get_post( (int) $id );
		if ( ! $post || 'specifico-table' !== $post->post_type ) {
			return new WP_Error( 'specifico_no_table', sprintf( 'No specification table with id %d.', (int) $id ) );
		}
		return $post;
	}

	private static function get_group_post( $id ) {
		$post = get_post( (int) $id );
		if ( ! $post || 'specifico-groups' !== $post->post_type ) {
			return new WP_Error( 'specifico_no_group', sprintf( 'No attribute group with id %d.', (int) $id ) );
		}
		return $post;
	}

	private static function get_product_post( $id ) {
		$post = get_post( (int) $id );
		if ( ! $post || 'product' !== $post->post_type ) {
			return new WP_Error( 'specifico_no_product', sprintf( 'No WooCommerce product with id %d. Use the parent product ID for variations.', (int) $id ) );
		}
		return $post;
	}

	/**
	 * Case-insensitive exact title lookup.
	 */
	private static function find_post_by_title( $post_type, $title ) {
		$title = trim( (string) $title );
		if ( '' === $title ) {
			return null;
		}

		// The `title` query var is an exact SQL match; the default collation
		// makes it case-insensitive. Compare again in PHP to be sure.
		$ids = get_posts(
			[
				'post_type'        => $post_type,
				'post_status'      => [ 'publish', 'draft', 'pending', 'private', 'future' ],
				'title'            => $title,
				'numberposts'      => 5,
				'fields'           => 'ids',
			]
		);

		foreach ( $ids as $id ) {
			if ( self::normalize( get_post_field( 'post_title', $id ) ) === self::normalize( $title ) ) {
				return get_post( $id );
			}
		}

		return null;
	}

	/**
	 * Table summary: id, name, enabled, group names.
	 */
	private static function table_summary( $post ) {
		$groups = get_post_meta( $post->ID, '_specifico_groups', true );

		return [
			'id'      => $post->ID,
			'name'    => $post->post_title,
			'enabled' => (bool) get_post_meta( $post->ID, '_specifico_status', true ),
			'groups'  => self::table_groups_output( is_array( $groups ) ? $groups : [] ),
		];
	}

	private static function table_groups_output( array $groups ) {
		$out = [];
		foreach ( $groups as $group ) {
			$id    = (int) ( $group['value'] ?? 0 );
			$out[] = [
				'id'   => $id,
				'name' => $id && get_post( $id ) ? get_the_title( $id ) : (string) ( $group['label'] ?? '' ),
			];
		}
		return $out;
	}

	/**
	 * Raw group attributes with stable IDs filled in (same fallback as the REST route).
	 */
	private static function group_attrs( $group_id ) {
		$attrs = get_post_meta( $group_id, '_specifico_attr', true );
		$out   = [];

		foreach ( (array) $attrs as $index => $attr ) {
			if ( ! is_array( $attr ) ) {
				continue;
			}
			$out[] = self::attr_row(
				! empty( $attr['id'] ) ? sanitize_key( (string) $attr['id'] ) : 'group-' . (int) $group_id . '-row-' . (int) $index,
				$attr['attributeName'] ?? '',
				$attr['attributeValue'] ?? '',
				$attr['attributeType'] ?? 'text',
				$attr['defaultValue'] ?? ''
			);
		}

		return $out;
	}

	private static function attr_row( $id, $name, $value, $type = 'text', $default = '' ) {
		return [
			'id'             => (string) $id,
			'attributeName'  => (string) $name,
			'attributeValue' => (string) $value,
			'attributeType'  => (string) $type,
			'defaultValue'   => (string) $default,
		];
	}

	private static function attrs_to_rows( array $attrs ) {
		$rows = [];
		foreach ( $attrs as $attr ) {
			$rows[] = [
				'id'    => $attr['id'],
				'name'  => $attr['attributeName'],
				'value' => $attr['attributeValue'],
			];
		}
		return $rows;
	}

	private static function group_rows( $group_id ) {
		return self::attrs_to_rows( self::group_attrs( $group_id ) );
	}

	private static function group_detail( $post ) {
		return [
			'id'     => $post->ID,
			'name'   => $post->post_title,
			'rows'   => self::group_rows( $post->ID ),
			'tables' => self::tables_using_group( $post->ID ),
		];
	}

	/**
	 * Tables whose group list includes a group.
	 */
	private static function tables_using_group( $group_id ) {
		$out    = [];
		$tables = get_posts( [ 'post_type' => 'specifico-table', 'numberposts' => -1 ] );

		foreach ( $tables as $table ) {
			$groups = get_post_meta( $table->ID, '_specifico_groups', true );
			foreach ( (array) $groups as $group ) {
				if ( (int) ( $group['value'] ?? 0 ) === (int) $group_id ) {
					$out[] = [
						'id'   => $table->ID,
						'name' => $table->post_title,
					];
					break;
				}
			}
		}

		return $out;
	}

	/**
	 * Resolve group IDs or names to the table meta shape [{value, label}].
	 */
	private static function resolve_groups( array $refs ) {
		$out    = [];
		$errors = [];

		foreach ( $refs as $ref ) {
			$post = is_numeric( $ref ) ? get_post( (int) $ref ) : self::find_post_by_title( 'specifico-groups', (string) $ref );

			if ( ! $post || 'specifico-groups' !== $post->post_type ) {
				$errors[] = (string) $ref;
				continue;
			}

			$out[] = [
				'value' => $post->ID,
				'label' => $post->post_title,
			];
		}

		if ( $errors ) {
			return new WP_Error( 'specifico_unknown_groups', sprintf( 'These groups do not exist: %s. Create them with create-group first.', implode( ', ', $errors ) ) );
		}

		return $out;
	}

	/**
	 * Render-ready groups to agent output.
	 */
	private static function groups_to_output( array $groups ) {
		$out = [];

		foreach ( $groups as $gi => $group ) {
			$rows = [];
			foreach ( (array) ( $group['inputGroups'] ?? [] ) as $ri => $row ) {
				$rows[] = [
					'key'   => Mapping_Resolver::row_key( $row, $gi, $ri ),
					'label' => (string) ( $row[0]['value'] ?? '' ),
					'value' => (string) ( $row[1]['value'] ?? '' ),
				];
			}

			$item = [
				'title' => (string) ( $group['title'] ?? '' ),
				'rows'  => $rows,
			];

			if ( ! empty( $group['auto'] ) ) {
				$item['automatic'] = true;
			}

			$out[] = $item;
		}

		return $out;
	}

	/**
	 * Everything an agent needs to know about one product's specs.
	 */
	private static function product_state( $product_id ) {
		$custom = 'custom' === get_post_meta( $product_id, '_specifico_override', true );
		$match  = Mapping_Resolver::resolve( $product_id );
		$groups = Mapping_Resolver::resolve_product_groups( $product_id );

		$state = [
			'product_id'   => (int) $product_id,
			'product_name' => get_the_title( $product_id ),
			'enabled'      => 'yes' === get_post_meta( $product_id, '_specifico_spec', true ),
			'mode'         => $custom ? 'custom' : 'inherit',
			'mapped_table' => $match ? [
				'id'         => (int) $match['table_id'],
				'name'       => $match['table_name'],
				'matched_by' => self::friendly_rule_type( $match['match_type'] ),
				'match'      => $match['match_value'],
			] : null,
			'groups'       => self::groups_to_output( $groups ),
		];

		$variations = self::variations_output( $product_id, $groups );
		if ( null !== $variations ) {
			$state['variation_count'] = $variations['total'];
			$state['variations']      = $variations['items'];
			$state['note']            = 'Rows in groups marked automatic come from the variation attributes and fill themselves. Each variation lists only the values it shows in place of the product value; set them with set-product-specs "variations".';
			if ( $variations['total'] > count( $variations['items'] ) ) {
				$state['note'] .= sprintf( ' Only the first %d variations are listed.', count( $variations['items'] ) );
			}
		}

		return $state;
	}

	/**
	 * Short product row for find-products.
	 *
	 * @param int $product_id Product ID.
	 */
	private static function product_summary( $product_id ) {
		$product = function_exists( 'wc_get_product' ) ? wc_get_product( $product_id ) : null;
		$match   = Mapping_Resolver::resolve( $product_id );
		$terms   = wp_get_post_terms( $product_id, 'product_cat', [ 'fields' => 'names' ] );

		$row = [
			'id'            => (int) $product_id,
			'name'          => get_the_title( $product_id ),
			'sku'           => $product ? (string) $product->get_sku() : '',
			'type'          => $product ? $product->get_type() : '',
			'status'        => get_post_status( $product_id ),
			'categories'    => is_wp_error( $terms ) ? [] : $terms,
			'specs_enabled' => 'yes' === get_post_meta( $product_id, '_specifico_spec', true ),
			'mode'          => 'custom' === get_post_meta( $product_id, '_specifico_override', true ) ? 'custom' : 'inherit',
			'mapped_table'  => $match ? [
				'id'   => (int) $match['table_id'],
				'name' => $match['table_name'],
			] : null,
		];

		if ( $product && $product->is_type( 'variable' ) ) {
			$row['variation_count'] = count( $product->get_children() );
		}

		return $row;
	}

	/**
	 * Compact per-product result for set-product-specs-bulk.
	 *
	 * @param array $result set-product-specs result.
	 */
	private static function bulk_item_output( array $result ) {
		return [
			'product_id'   => (int) $result['product_id'],
			'product_name' => get_the_title( (int) $result['product_id'] ),
			'mode'         => $result['mode'],
			'enabled'      => $result['enabled'],
			'changes'      => $result['changes'],
			'warnings'     => $result['warnings'],
		];
	}

	/**
	 * A variable product's variations with the values each one overrides.
	 *
	 * @param int   $product_id Product ID.
	 * @param array $groups     Render-ready product groups.
	 * @return array|null { total, items }, or null when the product is not variable.
	 */
	private static function variations_output( $product_id, array $groups ) {
		$product = function_exists( 'wc_get_product' ) ? wc_get_product( $product_id ) : null;
		if ( ! $product instanceof \WC_Product || ! $product->is_type( 'variable' ) ) {
			return null;
		}

		$labels = [];
		foreach ( $groups as $gi => $group ) {
			if ( ! empty( $group['auto'] ) ) {
				continue;
			}
			foreach ( (array) ( $group['inputGroups'] ?? [] ) as $ri => $row ) {
				$labels[ Mapping_Resolver::row_key( $row, $gi, $ri ) ] = (string) ( $row[0]['value'] ?? '' );
			}
		}

		$stored   = get_post_meta( $product_id, '_specifico_var_values', true );
		$stored   = is_array( $stored ) ? $stored : [];
		$children = array_map( 'intval', $product->get_children() );
		$items    = [];

		foreach ( array_slice( $children, 0, 100 ) as $variation_id ) {
			$values = [];
			foreach ( (array) ( $stored[ $variation_id ] ?? [] ) as $key => $value ) {
				if ( is_array( $value ) || ! isset( $labels[ $key ] ) ) {
					continue;
				}
				$values[] = [
					'key'   => (string) $key,
					'label' => $labels[ $key ],
					'value' => (string) $value,
				];
			}

			$variation = wc_get_product( $variation_id );
			$items[]   = [
				'id'         => $variation_id,
				'attributes' => self::variation_label( $variation_id ),
				'sku'        => $variation ? (string) $variation->get_sku() : '',
				'values'     => $values,
			];
		}

		return [
			'total' => count( $children ),
			'items' => $items,
		];
	}

	/**
	 * Merge agent variation input into the stored per-variation values.
	 *
	 * @param int   $product_id Product ID.
	 * @param array $groups     Groups the product will show (table or custom), without automatic rows.
	 * @param array $items      [{variation, values}].
	 * @param array $changes    Change log, appended to.
	 * @return array|WP_Error Full [variation_id][row_key] => value array.
	 */
	private static function apply_variation_input( $product_id, array $groups, array $items, array &$changes ) {
		$product = function_exists( 'wc_get_product' ) ? wc_get_product( $product_id ) : null;
		if ( ! $product instanceof \WC_Product || ! $product->is_type( 'variable' ) ) {
			return new WP_Error( 'specifico_not_variable', 'Only variable products have variations. Leave "variations" out for this product.' );
		}

		$children = array_map( 'intval', $product->get_children() );
		$stored   = get_post_meta( $product_id, '_specifico_var_values', true );
		$stored   = is_array( $stored ) ? $stored : [];
		$errors   = [];

		foreach ( $items as $item ) {
			$item         = (array) $item;
			$ref          = $item['variation'] ?? '';
			$variation_id = self::resolve_variation_id( $ref, $children );

			if ( ! $variation_id ) {
				$errors[] = sprintf( '"%s" is not a variation of this product. Use an ID or SKU from get-product-specs.', is_scalar( $ref ) ? $ref : '' );
				continue;
			}

			$values    = array_values( (array) ( $item['values'] ?? [] ) );
			$positions = self::locate_rows( $groups, $values );
			if ( is_wp_error( $positions ) ) {
				$errors[] = $positions->get_error_message();
				continue;
			}

			$name = self::variation_label( $variation_id );
			foreach ( $positions as $i => $pos ) {
				list( $gi, $ri ) = $pos;
				$row            = $groups[ $gi ]['inputGroups'][ $ri ];
				$key            = Mapping_Resolver::row_key( $row, $gi, $ri );
				$label          = (string) ( $row[0]['value'] ?? '' );
				$value          = (string) $values[ $i ]['value'];

				if ( '' === $value ) {
					unset( $stored[ $variation_id ][ $key ] );
					$changes[] = sprintf( 'Variation "%s": "%s" shows the product value again', $name, $label );
				} else {
					$stored[ $variation_id ][ $key ] = $value;
					$changes[]                       = sprintf( 'Variation "%s": set "%s" to "%s"', $name, $label, $value );
				}
			}

			if ( empty( $stored[ $variation_id ] ) ) {
				unset( $stored[ $variation_id ] );
			}
		}

		if ( $errors ) {
			return new WP_Error( 'specifico_variation_values', implode( ' ', $errors ) );
		}

		return $stored;
	}

	/**
	 * Variation ID from an ID or SKU, limited to one product's variations.
	 *
	 * @param mixed $ref      Variation ID or SKU.
	 * @param int[] $children The product's variation IDs.
	 * @return int 0 when it is not one of them.
	 */
	private static function resolve_variation_id( $ref, array $children ) {
		if ( is_numeric( $ref ) && in_array( (int) $ref, $children, true ) ) {
			return (int) $ref;
		}

		if ( is_string( $ref ) && '' !== trim( $ref ) && function_exists( 'wc_get_product_id_by_sku' ) ) {
			$id = (int) wc_get_product_id_by_sku( trim( $ref ) );
			if ( in_array( $id, $children, true ) ) {
				return $id;
			}
		}

		return 0;
	}

	/**
	 * Readable variation name, for example "Color: Red, Size: L".
	 *
	 * @param int $variation_id Variation ID.
	 */
	private static function variation_label( $variation_id ) {
		$variation = function_exists( 'wc_get_product' ) ? wc_get_product( $variation_id ) : null;

		if ( $variation instanceof \WC_Product_Variation && function_exists( 'wc_get_formatted_variation' ) ) {
			$label = wp_strip_all_tags( wc_get_formatted_variation( $variation, true, true, false ) );
			if ( '' !== $label ) {
				return $label;
			}
		}

		return '#' . (int) $variation_id;
	}

	/**
	 * Find [group_index, row_index] for each value item, by key or by group + label.
	 *
	 * @return array|WP_Error Positions keyed like $values.
	 */
	private static function locate_rows( array $groups, array $values ) {
		$by_key   = [];
		$by_label = [];

		foreach ( $groups as $gi => $group ) {
			foreach ( (array) ( $group['inputGroups'] ?? [] ) as $ri => $row ) {
				$by_key[ Mapping_Resolver::row_key( $row, $gi, $ri ) ] = [ $gi, $ri ];

				$label = self::normalize( $row[0]['value'] ?? '' );
				$title = self::normalize( $group['title'] ?? '' );
				$by_label[ $title . '|' . $label ] = [ $gi, $ri ];
				if ( ! isset( $by_label[ '*|' . $label ] ) ) {
					$by_label[ '*|' . $label ] = [ $gi, $ri ];
				} else {
					$by_label[ '*|' . $label ] = false; // Ambiguous without a group.
				}
			}
		}

		$positions = [];
		$errors    = [];

		foreach ( $values as $i => $item ) {
			$pos = null;

			if ( ! empty( $item['key'] ) ) {
				$pos = $by_key[ sanitize_key( (string) $item['key'] ) ] ?? null;
			} elseif ( ! empty( $item['label'] ) ) {
				$group = isset( $item['group'] ) ? self::normalize( $item['group'] ) : '*';
				$pos   = $by_label[ $group . '|' . self::normalize( $item['label'] ) ] ?? null;
				if ( false === $pos ) {
					$errors[] = sprintf( '"%s" appears in more than one group; pass group too.', $item['label'] );
					continue;
				}
			}

			if ( ! $pos ) {
				$errors[] = sprintf( 'No row matches %s.', wp_json_encode( array_diff_key( $item, [ 'value' => 1 ] ) ) );
				continue;
			}

			$positions[ $i ] = $pos;
		}

		if ( $errors ) {
			return new WP_Error( 'specifico_unknown_rows', implode( ' ', $errors ) . ' Call get-product-specs for row keys.' );
		}

		return $positions;
	}

	/**
	 * Build a custom table from agent input, keeping existing row keys where the
	 * group and label match so saved per-variation values stay attached.
	 */
	private static function custom_groups_from_input( array $input_groups, $product_id ) {
		$existing = get_post_meta( $product_id, '_specifico_groups', true );
		$keys     = [];

		foreach ( (array) $existing as $group ) {
			foreach ( (array) ( $group['inputGroups'] ?? [] ) as $row ) {
				if ( ! empty( $row[0]['key'] ) ) {
					$keys[ self::normalize( $group['title'] ?? '' ) . '|' . self::normalize( $row[0]['value'] ?? '' ) ] = $row[0]['key'];
				}
			}
		}

		$groups = [];
		foreach ( $input_groups as $group ) {
			$title = (string) $group['title'];
			$rows  = [];

			foreach ( (array) $group['rows'] as $row ) {
				$label  = (string) $row['label'];
				$lookup = self::normalize( $title ) . '|' . self::normalize( $label );
				$rows[] = [
					[
						'id'    => 1,
						'key'   => $keys[ $lookup ] ?? sanitize_key( 'row-' . wp_generate_uuid4() ),
						'value' => $label,
					],
					[
						'id'    => 2,
						'value' => (string) ( $row['value'] ?? '' ),
					],
				];
			}

			$groups[] = [
				'id'          => '',
				'title'       => $title,
				'inputGroups' => $rows,
			];
		}

		return $groups;
	}

	private static function mapping_rules() {
		$rules = get_option( '_specifico_mapping' );
		return is_array( $rules ) ? array_values( $rules ) : [];
	}

	private static function friendly_rule_type( $type ) {
		$map = [
			'product-category' => 'category',
			'product-tag'      => 'tag',
			'product-name'     => 'product',
			'product-id'       => 'product',
		];
		return $map[ $type ] ?? (string) $type;
	}

	/**
	 * Resolve a term by ID, slug or exact name.
	 */
	private static function resolve_term_value( $raw, $taxonomy ) {
		$term = null;

		if ( is_numeric( $raw ) ) {
			$term = get_term( (int) $raw, $taxonomy );
		}
		if ( ! $term || is_wp_error( $term ) ) {
			$term = get_term_by( 'slug', sanitize_title( (string) $raw ), $taxonomy );
		}
		if ( ! $term || is_wp_error( $term ) ) {
			$term = get_term_by( 'name', (string) $raw, $taxonomy );
		}

		if ( ! $term || is_wp_error( $term ) ) {
			return null;
		}

		return [
			'label' => $term->name,
			'value' => (int) $term->term_id,
		];
	}

	/**
	 * Resolve a product by ID, SKU or exact title.
	 */
	private static function resolve_product_value( $raw ) {
		$id = 0;

		if ( is_numeric( $raw ) && 'product' === get_post_type( (int) $raw ) ) {
			$id = (int) $raw;
		}
		if ( ! $id && function_exists( 'wc_get_product_id_by_sku' ) ) {
			$id = (int) wc_get_product_id_by_sku( (string) $raw );
			if ( $id && 'product_variation' === get_post_type( $id ) ) {
				$id = (int) wp_get_post_parent_id( $id );
			}
		}
		if ( ! $id ) {
			$found = self::find_post_by_title( 'product', (string) $raw );
			$id    = $found ? $found->ID : 0;
		}

		if ( ! $id ) {
			return null;
		}

		return [
			'label' => get_the_title( $id ),
			'value' => $id,
		];
	}

	private static function normalize( $text ) {
		$text = wp_strip_all_tags( (string) $text );
		$text = preg_replace( '/\s+/u', ' ', $text );
		return function_exists( 'mb_strtolower' ) ? mb_strtolower( trim( $text ) ) : strtolower( trim( $text ) );
	}

	private static function log( $message ) {
		if ( function_exists( 'wc_get_logger' ) ) {
			wc_get_logger()->warning( $message, [ 'source' => 'specifico' ] );
		}
	}
}
