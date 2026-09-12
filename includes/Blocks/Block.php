<?php
/**
 * Gutenberg block registration for Specifico.
 *
 * Registers the "Specification Table" block and its custom category.
 * Editor/frontend assets are enqueued automatically by WordPress from the
 * block.json `file:` references in build/blocks/specification-table/.
 *
 * @package specifico
 */

namespace WpAxiom\Specifico\Blocks;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Block {

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
	 * Register the Specification Table block (server-side metadata + render).
	 *
	 * Points at the compiled build/blocks/specification-table/ directory where
	 * wp-scripts has copied block.json and render.php from src/blocks/.
	 *
	 * @return void
	 */
	public static function register_block() {
		$dir = SPECIFICO_PATH . 'build/blocks/specification-table';

		if ( ! file_exists( $dir . '/block.json' ) ) {
			return;
		}

		register_block_type( $dir );
	}
}
