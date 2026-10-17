<?php
/**
 * Multilingual support (WPML and Polylang).
 *
 * Specification tables and attribute groups are shared across languages, so
 * their labels and default values are translated as strings, the same way
 * WooCommerce handles attribute labels. Per-product data lives in product
 * meta and is translated with the product itself (see wpml-config.xml, which
 * Polylang reads too).
 *
 * Mapping rules point at the IDs the merchant picked, usually in the default
 * language, so a translated product is also matched through its
 * default-language counterpart.
 *
 * @package specifico
 */

namespace WpAxiom\Specifico;

if ( ! defined( 'ABSPATH' ) ) exit;

class Multilingual {

	/**
	 * String translation context (WPML) and group (Polylang).
	 */
	const CONTEXT = 'Specifico';

	/**
	 * Hook string registration. Safe to call when no multilingual plugin is active.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'admin_init', [ __CLASS__, 'maybe_register_strings' ] );
	}

	/**
	 * Whether Polylang is active.
	 *
	 * Checked before WPML because Polylang ships a WPML compatibility layer.
	 *
	 * @return bool
	 */
	public static function is_polylang() {
		return function_exists( 'pll_register_string' ) && function_exists( 'pll__' );
	}

	/**
	 * Whether WPML is active.
	 *
	 * @return bool
	 */
	public static function is_wpml() {
		return ! self::is_polylang() && defined( 'ICL_SITEPRESS_VERSION' );
	}

	/**
	 * Whether any supported multilingual plugin is active.
	 *
	 * @return bool
	 */
	public static function is_active() {
		return self::is_polylang() || self::is_wpml();
	}

	/**
	 * The default-language translation of a post.
	 *
	 * @param int $post_id Product or variation post ID.
	 * @return int The translated ID, or the original ID when there is none.
	 */
	public static function default_language_post_id( $post_id ) {
		$post_id = (int) $post_id;

		if ( ! $post_id ) {
			return $post_id;
		}

		if ( self::is_polylang() ) {
			if ( ! function_exists( 'pll_get_post' ) || ! function_exists( 'pll_default_language' ) ) {
				return $post_id;
			}

			$translated = (int) pll_get_post( $post_id, pll_default_language() );

			return $translated ? $translated : $post_id;
		}

		if ( self::is_wpml() ) {
			$language = apply_filters( 'wpml_default_language', null ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- WPML public API hook.
			$type     = get_post_type( $post_id );

			if ( ! $language || ! $type ) {
				return $post_id;
			}

			return (int) apply_filters( 'wpml_object_id', $post_id, $type, true, $language ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- WPML public API hook.
		}

		return $post_id;
	}

	/**
	 * The default-language translation of a term.
	 *
	 * @param int    $term_id  Term ID.
	 * @param string $taxonomy Taxonomy name.
	 * @return int The translated ID, or the original ID when there is none.
	 */
	public static function default_language_term_id( $term_id, $taxonomy ) {
		$term_id = (int) $term_id;

		if ( ! $term_id ) {
			return $term_id;
		}

		if ( self::is_polylang() ) {
			if ( ! function_exists( 'pll_get_term' ) || ! function_exists( 'pll_default_language' ) ) {
				return $term_id;
			}

			$translated = (int) pll_get_term( $term_id, pll_default_language() );

			return $translated ? $translated : $term_id;
		}

		if ( self::is_wpml() ) {
			$language = apply_filters( 'wpml_default_language', null ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- WPML public API hook.

			if ( ! $language ) {
				return $term_id;
			}

			return (int) apply_filters( 'wpml_object_id', $term_id, $taxonomy, true, $language ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- WPML public API hook.
		}

		return $term_id;
	}

	/**
	 * Term IDs plus their default-language translations, so a rule matches
	 * whichever language its term was picked in.
	 *
	 * @param int[]  $term_ids Term IDs.
	 * @param string $taxonomy Taxonomy name.
	 * @return int[]
	 */
	public static function with_default_language_terms( array $term_ids, $taxonomy ) {
		$term_ids = array_map( 'intval', $term_ids );

		if ( ! self::is_active() ) {
			return $term_ids;
		}

		foreach ( $term_ids as $term_id ) {
			$term_ids[] = self::default_language_term_id( $term_id, $taxonomy );
		}

		return array_values( array_unique( $term_ids ) );
	}

	/**
	 * Translate the table-sourced labels and default values of render-ready
	 * groups into the current language.
	 *
	 * Skipped in wp-admin so editing screens keep showing and saving the
	 * original strings. Groups marked `auto` are built from translated
	 * WooCommerce data already and are left alone.
	 *
	 * @param array $groups Render-ready groups.
	 * @return array
	 */
	public static function translate_groups( array $groups ) {
		if ( ! self::is_active() || ( is_admin() && ! wp_doing_ajax() ) ) {
			return $groups;
		}

		foreach ( $groups as $gi => $group ) {
			if ( ! is_array( $group ) || ! empty( $group['auto'] ) ) {
				continue;
			}

			if ( isset( $group['title'] ) ) {
				$groups[ $gi ]['title'] = self::translate( $group['title'] );
			}

			foreach ( (array) ( $group['inputGroups'] ?? [] ) as $ri => $row ) {
				foreach ( [ 0, 1 ] as $cell ) {
					if ( isset( $row[ $cell ]['value'] ) && is_string( $row[ $cell ]['value'] ) ) {
						$groups[ $gi ]['inputGroups'][ $ri ][ $cell ]['value'] = self::translate( $row[ $cell ]['value'] );
					}
				}
			}
		}

		return $groups;
	}

	/**
	 * Register every table string while the translation plugin's string
	 * screen is open, so translators see the current set.
	 *
	 * Polylang keeps no record of registered strings between requests, so
	 * registering on its own screen is required, not just convenient.
	 *
	 * @return void
	 */
	public static function maybe_register_strings() {
		if ( ! self::is_active() ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only screen detection.
		$page = isset( $_GET['page'] ) ? sanitize_text_field( wp_unslash( $_GET['page'] ) ) : '';

		$on_strings_screen = self::is_polylang()
			? 'mlang_strings' === $page
			: false !== strpos( $page, 'string-translation' );

		if ( $on_strings_screen ) {
			self::register_all_strings();
		}
	}

	/**
	 * Register the group labels, attribute names, and default values that
	 * Mapping_Resolver::get_table_groups() renders.
	 *
	 * @return void
	 */
	public static function register_all_strings() {
		$strings = [];

		$table_ids = get_posts( [
			'post_type'      => 'specifico-table',
			'post_status'    => 'any',
			'posts_per_page' => -1,
			'fields'         => 'ids',
		] );

		foreach ( $table_ids as $table_id ) {
			$table_groups = get_post_meta( $table_id, '_specifico_groups', true );

			foreach ( (array) $table_groups as $group ) {
				if ( is_array( $group ) && ! empty( $group['label'] ) ) {
					$strings[] = (string) $group['label'];
				}
			}
		}

		$group_ids = get_posts( [
			'post_type'      => 'specifico-groups',
			'post_status'    => 'any',
			'posts_per_page' => -1,
			'fields'         => 'ids',
		] );

		foreach ( $group_ids as $group_id ) {
			$attrs = get_post_meta( $group_id, '_specifico_attr', true );

			foreach ( (array) $attrs as $attr ) {
				if ( ! is_array( $attr ) ) {
					continue;
				}
				foreach ( [ 'attributeName', 'attributeValue' ] as $field ) {
					if ( isset( $attr[ $field ] ) && is_string( $attr[ $field ] ) && '' !== trim( $attr[ $field ] ) ) {
						$strings[] = $attr[ $field ];
					}
				}
			}
		}

		foreach ( array_unique( $strings ) as $string ) {
			self::register( $string );
		}
	}

	/**
	 * Register one string with the active plugin.
	 *
	 * @param string $string Original string.
	 * @return void
	 */
	private static function register( $string ) {
		if ( self::is_polylang() ) {
			pll_register_string( self::string_name( $string ), $string, self::CONTEXT, false !== strpos( $string, "\n" ) );
			return;
		}

		do_action( 'wpml_register_single_string', self::CONTEXT, self::string_name( $string ), $string ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- WPML public API hook.
	}

	/**
	 * Translate one string into the current language.
	 *
	 * @param string $string Original string.
	 * @return string Translation, or the original when none exists.
	 */
	private static function translate( $string ) {
		if ( '' === trim( $string ) ) {
			return $string;
		}

		if ( self::is_polylang() ) {
			return pll__( $string );
		}

		return (string) apply_filters( 'wpml_translate_single_string', $string, self::CONTEXT, self::string_name( $string ) ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- WPML public API hook.
	}

	/**
	 * Stable string name. Identical text shares one translation, so a label
	 * like "Weight" is translated once for every group that uses it.
	 *
	 * @param string $string Original string.
	 * @return string
	 */
	private static function string_name( $string ) {
		return strlen( $string ) > 100 ? 'specifico-' . md5( $string ) : $string;
	}
}
