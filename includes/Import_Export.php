<?php
/**
 * Import / Export.
 *
 * Builds a portable JSON export of all Specifico data (tables, groups, mapping,
 * settings and optional per-product specification overrides), and imports it
 * back — either from Specifico's own format or from the competitor "Product
 * Specifications" (dornaweb) plugin export, auto-detected on import.
 *
 * Cross-references between posts (table -> group, mapping -> table, product ->
 * group) are stored as slug-based refs on export and remapped to freshly
 * created post IDs on import, so the data survives a move to another site.
 *
 * Shared static helper, same role as Mapping_Resolver.
 *
 * @package specifico
 * @author  WpAxiom <info@wpaxiom.com>
 * @since   1.0.4
 */

namespace WpAxiom\Specifico;

if ( ! defined( 'ABSPATH' ) ) exit;

class Import_Export {

	/**
	 * Bumped when the export envelope shape changes.
	 */
	const FORMAT_VERSION = 1;

	/**
	 * WooCommerce log source — view under WooCommerce > Status > Logs.
	 */
	const LOG_SOURCE = 'specifico';

	/**
	 * How many items to process per chunked import step.
	 */
	const CHUNK = 50;

	/**
	 * Lifetime of a chunked import session (job + state transients).
	 */
	const SESSION_TTL = HOUR_IN_SECONDS;

	/**
	 * Transient key prefix for chunked import sessions.
	 */
	const SESSION_PREFIX = 'specifico_import_';

	/**
	 * Ordered phases a chunked import walks through.
	 */
	const PHASES = [ 'groups', 'tables', 'mapping', 'settings', 'products' ];

	/**
	 * Build the export envelope.
	 *
	 * @param bool $include_products Whether to include per-product specification data.
	 * @return array
	 */
	public static function build_export( $include_products = true ) {
		$export = [
			'format'         => 'specifico',
			'format_version' => self::FORMAT_VERSION,
			'plugin_version' => defined( 'SPECIFICO_VERSION' ) ? SPECIFICO_VERSION : '',
			'db_version'     => (int) get_option( '_specifico_db_version', 0 ),
			'exported_at'    => gmdate( 'c' ),
			'site_url'       => home_url(),
			'groups'         => self::export_groups(),
			'tables'         => self::export_tables(),
			'mapping'        => self::export_mapping(),
			'settings'       => get_option( '_specifico_settings', [] ),
			'products'       => $include_products ? self::export_products() : [],
		];

		self::log(
			'info',
			sprintf(
				'Export generated: %d tables, %d groups, %d products (include_products=%s).',
				count( $export['tables'] ),
				count( $export['groups'] ),
				count( $export['products'] ),
				$include_products ? 'yes' : 'no'
			)
		);

		return $export;
	}

	/**
	 * Export all group definitions.
	 */
	private static function export_groups() {
		$out    = [];
		$groups = get_posts( [ 'post_type' => 'specifico-groups', 'numberposts' => -1 ] );

		foreach ( $groups as $group ) {
			$attr = get_post_meta( $group->ID, '_specifico_attr', true );

			$out[] = [
				'ref'   => self::ref( 'group', $group->post_name ),
				'title' => $group->post_title,
				'slug'  => $group->post_name,
				'attr'  => is_array( $attr ) ? array_values( $attr ) : [],
			];
		}

		return $out;
	}

	/**
	 * Export all specification tables, with their group list rewritten to refs.
	 */
	private static function export_tables() {
		$out    = [];
		$tables = get_posts( [ 'post_type' => 'specifico-table', 'numberposts' => -1 ] );

		foreach ( $tables as $table ) {
			$groups_meta = get_post_meta( $table->ID, '_specifico_groups', true );
			$group_refs  = [];

			if ( is_array( $groups_meta ) ) {
				foreach ( $groups_meta as $group ) {
					$gid  = isset( $group['value'] ) ? (int) $group['value'] : 0;
					$slug = $gid ? get_post_field( 'post_name', $gid ) : '';

					$group_refs[] = [
						'ref'   => self::ref( 'group', $slug ),
						'label' => $group['label'] ?? '',
					];
				}
			}

			$out[] = [
				'ref'    => self::ref( 'table', $table->post_name ),
				'title'  => $table->post_title,
				'slug'   => $table->post_name,
				'status' => (int) get_post_meta( $table->ID, '_specifico_status', true ),
				'groups' => $group_refs,
			];
		}

		return $out;
	}

	/**
	 * Export mapping rules. The spec table reference (stored, confusingly, under
	 * `category`) becomes a table ref, and each value entry is annotated with the
	 * slug of the category/tag/product it points at so it can be re-resolved on
	 * the target site.
	 */
	private static function export_mapping() {
		$mapping = get_option( '_specifico_mapping' );

		if ( ! is_array( $mapping ) ) {
			return [];
		}

		$out = [];

		foreach ( $mapping as $rule ) {
			$type     = $rule['type']['value'] ?? '';
			$table_id = isset( $rule['category']['value'] ) ? (int) $rule['category']['value'] : 0;

			$rule['category']['table_ref'] = $table_id
				? self::ref( 'table', get_post_field( 'post_name', $table_id ) )
				: '';

			if ( ! empty( $rule['values'] ) && is_array( $rule['values'] ) ) {
				foreach ( $rule['values'] as $i => $value ) {
					$rule['values'][ $i ]['slug'] = self::mapping_value_slug( $type, $value );
				}
			}

			$out[] = $rule;
		}

		return $out;
	}

	/**
	 * Resolve the portable slug for one mapping value entry.
	 */
	private static function mapping_value_slug( $type, $value ) {
		if ( 'product-category' === $type ) {
			$term = isset( $value['value'] ) ? get_term( (int) $value['value'], 'product_cat' ) : null;
			return ( $term && ! is_wp_error( $term ) ) ? $term->slug : '';
		}

		if ( 'product-tag' === $type ) {
			$term = isset( $value['value'] ) ? get_term( (int) $value['value'], 'product_tag' ) : null;
			return ( $term && ! is_wp_error( $term ) ) ? $term->slug : '';
		}

		// product-id stores the post ID in `label`; product-name stores it in `value`.
		if ( 'product-id' === $type ) {
			return get_post_field( 'post_name', (int) ( $value['label'] ?? 0 ) );
		}
		if ( 'product-name' === $type ) {
			return get_post_field( 'post_name', (int) ( $value['value'] ?? 0 ) );
		}

		return '';
	}

	/**
	 * Export per-product specification data for every product with the spec tab
	 * enabled (custom overrides and/or inherited-value edits travel with it).
	 */
	private static function export_products() {
		$out = [];

		$query = new \WP_Query( [
			'post_type'      => 'product',
			'posts_per_page' => -1,
			'fields'         => 'ids',
			'no_found_rows'  => true,
			'meta_query'     => [ // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- Admin-only one-off export.
				[
					'key'   => '_specifico_spec',
					'value' => 'yes',
				],
			],
		] );

		foreach ( $query->posts as $product_id ) {
			$product_id = (int) $product_id;
			$groups     = get_post_meta( $product_id, '_specifico_groups', true );
			$groups     = is_array( $groups ) ? $groups : [];

			// Annotate each custom group with the source group's slug ref.
			foreach ( $groups as $i => $group ) {
				$gid               = isset( $group['id'] ) ? (int) $group['id'] : 0;
				$groups[ $i ]['ref'] = $gid ? self::ref( 'group', get_post_field( 'post_name', $gid ) ) : '';
			}

			$inherit = get_post_meta( $product_id, '_specifico_inherit_values', true );

			$out[] = [
				'match'          => [ 'by' => 'slug', 'value' => get_post_field( 'post_name', $product_id ) ],
				'spec'           => get_post_meta( $product_id, '_specifico_spec', true ),
				'override'       => get_post_meta( $product_id, '_specifico_override', true ),
				'groups'         => $groups,
				'inherit_values' => is_array( $inherit ) ? $inherit : [],
			];
		}

		return $out;
	}

	/* --------------------------------------------------------------------- */
	/* Import                                                                 */
	/* --------------------------------------------------------------------- */

	/**
	 * Detect which format an uploaded payload is.
	 *
	 * @return string 'specifico' | 'dornaweb' | 'unknown'
	 */
	public static function detect_format( $data ) {
		if ( is_array( $data ) && isset( $data['format'] ) && 'specifico' === $data['format'] ) {
			return 'specifico';
		}

		// dornaweb export is a flat list of tables, each with a `skleton` group list.
		if ( is_array( $data ) && isset( $data[0] ) && is_array( $data[0] )
			&& ( isset( $data[0]['skleton'] ) || isset( $data[0]['table-slug'] ) ) ) {
			return 'dornaweb';
		}

		return 'unknown';
	}

	/**
	 * Import a decoded payload in one shot, auto-detecting the format.
	 *
	 * Kept for programmatic/back-compat use and dry-run counting. The admin UI
	 * uses the chunked prepare_import()/step_import() flow instead, which avoids
	 * PHP timeouts on large imports.
	 *
	 * @param array $data    Decoded JSON.
	 * @param bool  $dry_run When true, count without writing.
	 * @return array Summary.
	 */
	public static function import( $data, $dry_run = false ) {
		$format = self::detect_format( $data );

		$summary = self::fresh_summary( $format );
		$summary['dry_run'] = (bool) $dry_run;

		if ( 'unknown' === $format ) {
			$summary['errors'][] = __( 'Unrecognised file format.', 'specifico' );
			if ( ! $dry_run ) {
				self::log( 'warning', 'Import aborted: unrecognised file format.' );
			}
			return $summary;
		}

		$canonical = self::normalize( $format, $data );

		if ( $dry_run ) {
			$summary['groups']     = count( $canonical['groups'] );
			$summary['tables']     = count( $canonical['tables'] );
			$summary['products']   = count( $canonical['products'] );
			$summary['attributes'] = self::count_attributes( $canonical['groups'] );
			return $summary;
		}

		self::log( 'info', sprintf( 'Import started (format: %s).', $format ) );

		$state = [ 'group_map' => [], 'table_map' => [], 'summary' => $summary ];

		foreach ( $canonical['groups'] as $group ) {
			self::write_group( $group, $state );
		}
		foreach ( $canonical['tables'] as $table ) {
			self::write_table( $table, $state );
		}
		self::import_mapping( $canonical['mapping'], $state['table_map'], $state['summary'] );
		if ( is_array( $canonical['settings'] ) ) {
			update_option( '_specifico_settings', $canonical['settings'] );
		}
		foreach ( $canonical['products'] as $product ) {
			self::write_product( $product, $state );
		}

		self::refresh_counts();

		$summary = $state['summary'];
		self::log( self::has_issues( $summary ) ? 'warning' : 'info', 'Import complete: ' . wp_json_encode( $summary ) );

		return $summary;
	}

	/**
	 * Begin a chunked import: detect + normalize the payload into a canonical
	 * job, persist it (plus initial progress state) under a session id, and
	 * return the totals so the UI can render a progress bar. No data is written
	 * yet — call step_import() repeatedly to do the work in small batches.
	 *
	 * @param array $data Decoded JSON.
	 * @return array { session, format, totals } or { error, format }.
	 */
	public static function prepare_import( $data ) {
		$format = self::detect_format( $data );

		if ( 'unknown' === $format ) {
			return [ 'error' => __( 'Unrecognised file format.', 'specifico' ), 'format' => 'unknown' ];
		}

		$canonical = self::normalize( $format, $data );

		$totals = [
			'groups'     => count( $canonical['groups'] ),
			'tables'     => count( $canonical['tables'] ),
			'attributes' => self::count_attributes( $canonical['groups'] ),
			'mapping'    => count( $canonical['mapping'] ),
			'products'   => count( $canonical['products'] ),
		];

		$progress = [
			'groups'   => [ 'processed' => 0, 'total' => $totals['groups'] ],
			'tables'   => [ 'processed' => 0, 'total' => $totals['tables'] ],
			'mapping'  => [ 'processed' => 0, 'total' => $totals['mapping'] ],
			'settings' => [ 'processed' => 0, 'total' => is_array( $canonical['settings'] ) ? 1 : 0 ],
			'products' => [ 'processed' => 0, 'total' => $totals['products'] ],
		];

		$session = wp_generate_uuid4();
		$state   = [
			'phase_index' => self::first_phase_index( $progress ),
			'cursor'      => 0,
			'group_map'   => [],
			'table_map'   => [],
			'summary'     => self::fresh_summary( $format ),
			'progress'    => $progress,
		];

		set_transient( self::SESSION_PREFIX . 'job_' . $session, $canonical, self::SESSION_TTL );
		set_transient( self::SESSION_PREFIX . 'state_' . $session, $state, self::SESSION_TTL );

		self::log( 'info', sprintf( 'Import prepared (%s): %d tables, %d groups, %d products.', $format, $totals['tables'], $totals['groups'], $totals['products'] ) );

		return [ 'session' => $session, 'format' => $format, 'totals' => $totals ];
	}

	/**
	 * Process the next batch of a prepared import and report progress.
	 *
	 * Each call does at most self::CHUNK writes, persists the cursor + id maps,
	 * and returns the running progress. The client calls this in a loop until
	 * `finished` is true, so no single request runs long enough to time out.
	 *
	 * @param string $session Session id from prepare_import().
	 * @return array Progress payload.
	 */
	public static function step_import( $session ) {
		$job   = get_transient( self::SESSION_PREFIX . 'job_' . $session );
		$state = get_transient( self::SESSION_PREFIX . 'state_' . $session );

		if ( ! is_array( $job ) || ! is_array( $state ) ) {
			return [ 'finished' => true, 'error' => __( 'Import session expired. Please upload the file again.', 'specifico' ) ];
		}

		$phase = self::PHASES[ $state['phase_index'] ] ?? null;

		if ( null === $phase ) {
			return self::finish_import( $session, $state );
		}

		switch ( $phase ) {
			case 'mapping':
				self::import_mapping( $job['mapping'], $state['table_map'], $state['summary'] );
				$state['progress']['mapping']['processed'] = $state['progress']['mapping']['total'];
				self::advance( $state );
				break;

			case 'settings':
				if ( is_array( $job['settings'] ) ) {
					update_option( '_specifico_settings', $job['settings'] );
				}
				$state['progress']['settings']['processed'] = $state['progress']['settings']['total'];
				self::advance( $state );
				break;

			default: // groups | tables | products — chunked.
				$items = $job[ $phase ];
				$end   = min( $state['cursor'] + self::CHUNK, count( $items ) );
				for ( ; $state['cursor'] < $end; $state['cursor']++ ) {
					self::write_item( $phase, $items[ $state['cursor'] ], $state );
				}
				$state['progress'][ $phase ]['processed'] = $state['cursor'];
				if ( $state['cursor'] >= count( $items ) ) {
					self::advance( $state );
				}
				break;
		}

		if ( $state['phase_index'] >= count( self::PHASES ) ) {
			return self::finish_import( $session, $state );
		}

		set_transient( self::SESSION_PREFIX . 'state_' . $session, $state, self::SESSION_TTL );

		return [
			'finished'      => false,
			'current_phase' => self::PHASES[ $state['phase_index'] ] ?? $phase,
			'progress'      => $state['progress'],
			'summary'       => $state['summary'],
		];
	}

	/**
	 * Dispatch a single chunked item to the right writer.
	 */
	private static function write_item( $phase, $item, &$state ) {
		if ( 'groups' === $phase ) {
			self::write_group( $item, $state );
		} elseif ( 'tables' === $phase ) {
			self::write_table( $item, $state );
		} elseif ( 'products' === $phase ) {
			self::write_product( $item, $state );
		}
	}

	/**
	 * Advance to the next phase that actually has work, or off the end.
	 */
	private static function advance( &$state ) {
		do {
			$state['phase_index']++;
			$state['cursor'] = 0;
			$phase           = self::PHASES[ $state['phase_index'] ] ?? null;
		} while ( null !== $phase && ( $state['progress'][ $phase ]['total'] ?? 0 ) <= 0 );
	}

	/**
	 * Index of the first phase with work to do (or past the end if none).
	 */
	private static function first_phase_index( $progress ) {
		foreach ( self::PHASES as $i => $phase ) {
			if ( ( $progress[ $phase ]['total'] ?? 0 ) > 0 ) {
				return $i;
			}
		}
		return count( self::PHASES );
	}

	/**
	 * Finalize a chunked import: refresh counts, log, drop the session.
	 */
	private static function finish_import( $session, $state ) {
		self::refresh_counts();

		$summary = $state['summary'];
		self::log( self::has_issues( $summary ) ? 'warning' : 'info', 'Import complete: ' . wp_json_encode( $summary ) );

		delete_transient( self::SESSION_PREFIX . 'job_' . $session );
		delete_transient( self::SESSION_PREFIX . 'state_' . $session );

		return [
			'finished'      => true,
			'current_phase' => 'done',
			'progress'      => $state['progress'],
			'summary'       => $summary,
		];
	}

	/**
	 * A zeroed summary structure.
	 */
	private static function fresh_summary( $format ) {
		return [
			'format'     => $format,
			'tables'     => 0,
			'groups'     => 0,
			'attributes' => 0,
			'products'   => 0,
			'skipped'    => [ 'products' => 0, 'mapping_values' => 0 ],
			'errors'     => [],
		];
	}

	private static function has_issues( $summary ) {
		return ! empty( $summary['errors'] )
			|| $summary['skipped']['products'] > 0
			|| $summary['skipped']['mapping_values'] > 0;
	}

	private static function count_attributes( $groups ) {
		$total = 0;
		foreach ( (array) $groups as $g ) {
			$total += is_array( $g['attr'] ?? null ) ? count( $g['attr'] ) : 0;
		}
		return $total;
	}

	/**
	 * Normalize either supported format into one canonical job structure:
	 * { format, groups[], tables[], mapping[], settings, products[] }.
	 */
	private static function normalize( $format, $data ) {
		return 'specifico' === $format ? self::normalize_specifico( $data ) : self::normalize_dornaweb( $data );
	}

	/**
	 * Specifico's own export is already canonical — just normalize array keys.
	 */
	private static function normalize_specifico( $data ) {
		return [
			'format'   => 'specifico',
			'groups'   => array_values( (array) ( $data['groups'] ?? [] ) ),
			'tables'   => array_values( (array) ( $data['tables'] ?? [] ) ),
			'mapping'  => array_values( (array) ( $data['mapping'] ?? [] ) ),
			'settings' => isset( $data['settings'] ) && is_array( $data['settings'] ) ? $data['settings'] : null,
			'products' => array_values( (array) ( $data['products'] ?? [] ) ),
		];
	}

	/**
	 * Convert a competitor (dornaweb) export into our canonical job structure,
	 * de-duplicating groups by slug across tables.
	 */
	private static function normalize_dornaweb( $data ) {
		$groups_by_slug = [];
		$tables         = [];
		$products       = [];

		foreach ( (array) $data as $table ) {
			$table_group_refs = [];

			foreach ( (array) ( $table['skleton'] ?? [] ) as $group ) {
				$slug = sanitize_title( $group['slug'] ?? $group['name'] ?? '' );
				if ( ! $slug ) {
					continue;
				}
				$name = $group['name'] ?? $slug;

				if ( ! isset( $groups_by_slug[ $slug ] ) ) {
					$attr = [];
					foreach ( (array) ( $group['attributes'] ?? [] ) as $a ) {
						// Their attribute-level `attr_default` is the value shown for
						// the attribute. Specifico displays `attributeValue`, so map it
						// there (and keep it in defaultValue for select/radio types).
						$default_val = is_scalar( $a['default'] ?? '' ) ? (string) ( $a['default'] ?? '' ) : '';
						$attr[]      = [
							'attributeName'  => $a['title'] ?? '',
							'attributeValue' => $default_val,
							'attributeType'  => self::map_dornaweb_type( $a['type'] ?? '' ),
							'defaultValue'   => $default_val,
						];
					}
					$groups_by_slug[ $slug ] = [
						'ref'   => self::ref( 'group', $slug ),
						'title' => $name,
						'slug'  => $slug,
						'attr'  => $attr,
					];
				}

				$table_group_refs[] = [ 'ref' => self::ref( 'group', $slug ), 'label' => $name ];
			}

			$tslug = sanitize_title( $table['table-slug'] ?? $table['table-title'] ?? '' );
			if ( $tslug ) {
				$tables[] = [
					'ref'    => self::ref( 'table', $tslug ),
					'title'  => $table['table-title'] ?? $tslug,
					'slug'   => $tslug,
					'status' => 1,
					'groups' => $table_group_refs,
				];
			}

			foreach ( (array) ( $table['products'] ?? [] ) as $product ) {
				if ( ! is_array( $product['table'] ?? null ) ) {
					continue;
				}

				$cgroups = [];
				foreach ( $product['table'] as $g ) {
					$input_groups = [];
					foreach ( (array) ( $g['attributes'] ?? [] ) as $attr ) {
						$input_groups[] = [
							[ 'id' => 1, 'value' => $attr['attr_name'] ?? '' ],
							[ 'id' => 2, 'value' => $attr['value'] ?? '' ],
						];
					}
					$cgroups[] = [
						'id'          => 0,
						'title'       => $g['group_name'] ?? '',
						'inputGroups' => $input_groups,
					];
				}

				$products[] = [
					'match'          => [ 'by' => 'slug', 'value' => $product['slug'] ?? '' ],
					'spec'           => 'yes',
					'override'       => 'custom',
					'groups'         => $cgroups,
					'inherit_values' => [],
				];
			}
		}

		return [
			'format'   => 'dornaweb',
			'groups'   => array_values( $groups_by_slug ),
			'tables'   => $tables,
			'mapping'  => [],
			'settings' => null,
			'products' => $products,
		];
	}

	/**
	 * Create/update one group from canonical data; records it in the id map.
	 */
	private static function write_group( $group, &$state ) {
		$slug = sanitize_title( $group['slug'] ?? $group['title'] ?? '' );
		if ( ! $slug ) {
			return;
		}

		$gid = self::upsert_post( 'specifico-groups', $slug, $group['title'] ?? $slug, false );
		if ( $gid ) {
			update_post_meta( $gid, '_specifico_attr', self::sanitize_attr( $group['attr'] ?? [] ) );
		}

		$state['group_map'][ self::ref( 'group', $slug ) ] = $gid;
		if ( isset( $group['ref'] ) ) {
			$state['group_map'][ $group['ref'] ] = $gid;
		}

		$state['summary']['groups']++;
		$state['summary']['attributes'] += is_array( $group['attr'] ?? null ) ? count( $group['attr'] ) : 0;
	}

	/**
	 * Create/update one table, wiring its group list through the id map.
	 */
	private static function write_table( $table, &$state ) {
		$slug = sanitize_title( $table['slug'] ?? $table['title'] ?? '' );
		if ( ! $slug ) {
			return;
		}

		$tid = self::upsert_post( 'specifico-table', $slug, $table['title'] ?? $slug, false );
		if ( $tid ) {
			$groups_meta = [];
			foreach ( (array) ( $table['groups'] ?? [] ) as $gref ) {
				$ref = $gref['ref'] ?? '';
				if ( ! empty( $state['group_map'][ $ref ] ) ) {
					$groups_meta[] = [
						'value' => $state['group_map'][ $ref ],
						'label' => sanitize_text_field( $gref['label'] ?? '' ),
					];
				}
			}
			update_post_meta( $tid, '_specifico_groups', $groups_meta );
			update_post_meta( $tid, '_specifico_status', (int) ( $table['status'] ?? 0 ) );
		}

		$state['table_map'][ self::ref( 'table', $slug ) ] = $tid;
		if ( isset( $table['ref'] ) ) {
			$state['table_map'][ $table['ref'] ] = $tid;
		}

		$state['summary']['tables']++;
	}

	/**
	 * Rebuild mapping rules, remapping table refs and re-resolving value slugs.
	 */
	private static function import_mapping( $mapping, $table_map, &$summary ) {
		if ( ! is_array( $mapping ) || empty( $mapping ) ) {
			return;
		}

		$out = [];

		foreach ( $mapping as $rule ) {
			$type     = $rule['type']['value'] ?? '';
			$ref      = $rule['category']['table_ref'] ?? '';
			$table_id = $table_map[ $ref ] ?? 0;

			if ( ! $table_id ) {
				continue; // table did not import; rule is meaningless.
			}

			$rule['category']['value'] = $table_id;
			unset( $rule['category']['table_ref'] );

			$values = [];
			foreach ( (array) ( $rule['values'] ?? [] ) as $value ) {
				$resolved = self::resolve_mapping_value( $type, $value );
				if ( null === $resolved ) {
					$summary['skipped']['mapping_values']++;
					continue;
				}
				unset( $resolved['slug'] );
				$values[] = $resolved;
			}

			if ( empty( $values ) ) {
				continue;
			}

			$rule['values'] = $values;
			$out[]          = $rule;
		}

		if ( ! empty( $out ) ) {
			update_option( '_specifico_mapping', $out, true );
		}
	}

	/**
	 * Re-resolve one mapping value's target ID on this site from its slug.
	 *
	 * @return array|null The value entry with its ID fixed up, or null if unresolved.
	 */
	private static function resolve_mapping_value( $type, $value ) {
		$slug = $value['slug'] ?? '';

		if ( 'product-category' === $type || 'product-tag' === $type ) {
			if ( ! $slug ) {
				return null;
			}
			$taxonomy = 'product-category' === $type ? 'product_cat' : 'product_tag';
			$term     = get_term_by( 'slug', $slug, $taxonomy );
			if ( ! $term ) {
				return null;
			}
			$value['value'] = $term->term_id;
			return $value;
		}

		if ( 'product-id' === $type || 'product-name' === $type ) {
			$product = $slug ? get_page_by_path( $slug, OBJECT, 'product' ) : null;
			if ( ! $product ) {
				return null;
			}
			// product-id keeps the ID in `label`; product-name keeps it in `value`.
			if ( 'product-id' === $type ) {
				$value['label'] = (string) $product->ID;
			} else {
				$value['value'] = $product->ID;
			}
			return $value;
		}

		return $value;
	}

	/**
	 * Write one product's specification override, matched by slug. Records a
	 * skip when no product on this site matches.
	 */
	private static function write_product( $product, &$state ) {
		$slug = $product['match']['value'] ?? '';
		$post = $slug ? get_page_by_path( $slug, OBJECT, 'product' ) : null;

		if ( ! $post ) {
			$state['summary']['skipped']['products']++;
			return;
		}

		$pid    = $post->ID;
		$groups = self::sanitize_product_groups( $product['groups'] ?? [], $state['group_map'] );

		update_post_meta( $pid, '_specifico_spec', 'yes' === ( $product['spec'] ?? '' ) ? 'yes' : 'no' );
		update_post_meta( $pid, '_specifico_override', 'custom' === ( $product['override'] ?? '' ) ? 'custom' : '' );
		update_post_meta( $pid, '_specifico_groups', $groups );
		update_post_meta( $pid, '_specifico_inherit_values', self::sanitize_inherit_values( $product['inherit_values'] ?? [] ) );

		$state['summary']['products']++;
	}

	/* --------------------------------------------------------------------- */
	/* Helpers                                                                */
	/* --------------------------------------------------------------------- */

	/**
	 * Build a stable slug-based ref, e.g. ref('group','display') => 'group:display'.
	 */
	private static function ref( $type, $slug ) {
		return $slug ? $type . ':' . $slug : '';
	}

	/**
	 * Find a CPT post by slug, or create it. Returns the post ID (0 on dry run /
	 * failure). Existing posts are reused so re-importing is idempotent.
	 */
	private static function upsert_post( $post_type, $slug, $title, $dry_run ) {
		$existing = get_page_by_path( $slug, OBJECT, $post_type );
		if ( $existing ) {
			return (int) $existing->ID;
		}

		if ( $dry_run ) {
			return 0;
		}

		$id = wp_insert_post( [
			'post_type'   => $post_type,
			'post_title'  => sanitize_text_field( $title ),
			'post_name'   => $slug,
			'post_status' => 'publish',
			'post_author' => get_current_user_id(),
		], true );

		if ( is_wp_error( $id ) ) {
			self::log(
				'error',
				sprintf( 'Failed to create %s "%s": %s', $post_type, $slug, $id->get_error_message() )
			);
			return 0;
		}

		return (int) $id;
	}

	/**
	 * Write a line to the WooCommerce log under the `specifico` source.
	 *
	 * Used to keep an audit trail of import/export runs (and any per-item
	 * failures) so issues can be diagnosed after the fact. No-ops if the
	 * WooCommerce logger is unavailable.
	 *
	 * @param string $level   One of WC_Log_Levels (info|warning|error|…).
	 * @param string $message Log line.
	 */
	private static function log( $level, $message ) {
		if ( ! function_exists( 'wc_get_logger' ) ) {
			return;
		}

		$logger = wc_get_logger();
		if ( $logger ) {
			$logger->log( $level, $message, [ 'source' => self::LOG_SOURCE ] );
		}
	}

	/**
	 * Map a dornaweb attribute type onto a Specifico type. Specifico supports
	 * text/textarea/select/radio; their `true-false` has no equivalent, so it
	 * (and anything unknown) falls back to text.
	 */
	private static function map_dornaweb_type( $type ) {
		$map = [
			'text'     => 'text',
			'textarea' => 'textarea',
			'select'   => 'select',
		];
		return $map[ $type ] ?? 'text';
	}

	/**
	 * Sanitize a group's attribute definition list.
	 */
	private static function sanitize_attr( $attr ) {
		$out = [];
		foreach ( (array) $attr as $row ) {
			$out[] = [
				'attributeName'  => sanitize_text_field( $row['attributeName'] ?? '' ),
				'attributeValue' => wp_kses_post( $row['attributeValue'] ?? '' ),
				'attributeType'  => sanitize_text_field( $row['attributeType'] ?? 'text' ),
				'defaultValue'   => wp_kses_post( $row['defaultValue'] ?? '' ),
			];
		}
		return $out;
	}

	/**
	 * Sanitize per-product override groups and remap the source group ref to a
	 * local group ID where one exists.
	 */
	private static function sanitize_product_groups( $groups, $group_map ) {
		$out = [];
		foreach ( (array) $groups as $group ) {
			$ref = $group['ref'] ?? '';
			$id  = $group_map[ $ref ] ?? ( isset( $group['id'] ) ? (int) $group['id'] : 0 );

			$input_groups = [];
			foreach ( (array) ( $group['inputGroups'] ?? [] ) as $row ) {
				$cells = [];
				foreach ( (array) $row as $cell ) {
					$cells[] = [
						'id'    => isset( $cell['id'] ) ? (int) $cell['id'] : 0,
						'value' => wp_kses_post( $cell['value'] ?? '' ),
					];
				}
				$input_groups[] = $cells;
			}

			$out[] = [
				'id'          => $id,
				'title'       => sanitize_text_field( $group['title'] ?? '' ),
				'inputGroups' => $input_groups,
			];
		}
		return $out;
	}

	/**
	 * Sanitize the nested _specifico_inherit_values array (group => row => value).
	 */
	private static function sanitize_inherit_values( $values ) {
		$out = [];
		foreach ( (array) $values as $gi => $rows ) {
			if ( ! is_array( $rows ) ) {
				continue;
			}
			foreach ( $rows as $ri => $value ) {
				$out[ (int) $gi ][ (int) $ri ] = wp_kses_post( is_scalar( $value ) ? $value : '' );
			}
		}
		return $out;
	}

	/**
	 * Recount published tables/groups into the count options used for menu badges.
	 */
	private static function refresh_counts() {
		foreach ( [ '_specifico_tables' => 'specifico-table', '_specifico_groups' => 'specifico-groups' ] as $option => $post_type ) {
			$ids = get_posts( [ 'numberposts' => -1, 'post_type' => $post_type, 'fields' => 'ids', 'post_status' => 'publish' ] );
			update_option( $option, count( $ids ), true );
		}
	}
}
