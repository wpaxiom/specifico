<?php

/**
 * Fired when the plugin is uninstalled.
 *
 * Removes every trace of Specifico from the site: options, transients, the
 * `specifico-table` and `specifico-groups` custom post types (and their meta),
 * and the WooCommerce product post meta the plugin writes.
 *
 * @package Specifico
 */

// If uninstall not called from WordPress, then exit.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

/**
 * Delete the plugin's data on the current site.
 *
 * Runs once per site on a network so the body is not duplicated.
 *
 * @return void
 */
function specifico_uninstall_cleanup() {
	// Options.
	$specifico_options = array(
		'_specifico_tables',
		'_specifico_groups',
		'_specifico_mapping',
		'_specifico_settings',
		'_specifico_db_version',
	);

	foreach ( $specifico_options as $specifico_option ) {
		delete_option( $specifico_option );
	}

	// Transients: the import lock and any per-session import state.
	delete_transient( 'specifico_importing' );

	// Custom post types: `specifico-table` and `specifico-groups` and their meta.
	$specifico_post_types = array( 'specifico-table', 'specifico-groups' );
	foreach ( $specifico_post_types as $specifico_post_type ) {
		$specifico_posts = get_posts(
			array(
				'post_type'      => $specifico_post_type,
				'numberposts'    => -1,
				'post_status'    => 'any',
				'fields'         => 'ids',
				'no_found_rows'  => true,
			)
		);

		if ( empty( $specifico_posts ) ) {
			continue;
		}

		foreach ( $specifico_posts as $specifico_post_id ) {
			wp_delete_post( $specifico_post_id, true );
		}
	}

	// Per-session import transients (`specifico_import_job_*`,
	// `specifico_import_state_*`) hold no predictable single key, so sweep the
	// `_transient_specifico_import_*` option rows directly.
	global $wpdb;
	$specifico_like = $wpdb->esc_like( '_transient_specifico_import_' ) . '%';
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Deletes own session transients; uninstall only.
	$specifico_transient_rows = $wpdb->get_col(
		$wpdb->prepare( "SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE %s", $specifico_like )
	);

	foreach ( (array) $specifico_transient_rows as $specifico_transient_name ) {
		delete_transient( str_replace( '_transient_', '', $specifico_transient_name ) );
	}

	// Product post meta (the last two legacy keys from db v1).
	$specifico_meta_keys = array(
		'_specifico_spec',
		'_specifico_override',
		'_specifico_groups',
		'_specifico_type',
		'_specifico_table',
	);

	foreach ( $specifico_meta_keys as $specifico_meta_key ) {
		delete_metadata( 'post', 0, $specifico_meta_key, '', true );
	}
}

if ( is_multisite() && ! wp_is_large_network() && function_exists( 'get_sites' ) ) {
	$specifico_sites = get_sites(
		array(
			'number' => 0,
		)
	);

	foreach ( $specifico_sites as $specifico_site ) {
		switch_to_blog( $specifico_site->blog_id );
		specifico_uninstall_cleanup();
		restore_current_blog();
	}
} else {
	specifico_uninstall_cleanup();
}
