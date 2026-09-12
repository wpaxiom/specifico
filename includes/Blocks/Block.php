<?php
/**
 * Gutenberg block registration for Specifico.
 *
 * Registers the "Specification Table" and "Comparison Table" blocks and the
 * shared "Specifico" category. Editor/frontend assets are enqueued
 * automatically by WordPress from each block.json's `file:` references to
 * the compiled build/blocks directories.
 *
 * @package specifico
 */

namespace WpAxiom\Specifico\Blocks;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Block {

	/**
	 * Registered block slugs, matching the directories under build/blocks/.
	 *
	 * @var string[]
	 */
	const BLOCKS = [ 'specification-table', 'comparison-table' ];

	/**
	 * Boot the block infrastructure. Called once from Specifico::init_plugin().
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'init', [ self::class, 'register_block' ] );
		add_filter( 'block_categories_all', [ self::class, 'register_category' ] );
	}

	/**
	 * Register the "Specifico" block category in the block inserter.
	 *
	 * @param array $categories Existing block categories.
	 * @return array
	 */
	public static function register_category( $categories ) {
		$categories[] = [
			'slug'  => 'specifico',
			'title' => __( 'Specifico', 'specifico' ),
		];

		return $categories;
	}

	/**
	 * Register all Specifico blocks (server-side metadata + render).
	 *
	 * Points at the compiled build/blocks/<slug>/ directories where wp-scripts
	 * has copied block.json and render.php from src/blocks/.
	 *
	 * @return void
	 */
	public static function register_block() {
		foreach ( self::BLOCKS as $slug ) {
			$dir = SPECIFICO_PATH . 'build/blocks/' . $slug;

			if ( ! file_exists( $dir . '/block.json' ) ) {
				continue;
			}

			register_block_type( $dir );
		}
	}
}
