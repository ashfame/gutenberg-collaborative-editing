<?php
namespace DotOrg\GCE;

class Engine {
	public function __construct() {
		add_action( 'enqueue_block_editor_assets', [ $this, 'enqueue_editor_assets' ] );
	}

	public function enqueue_editor_assets() {
		$asset_file_path = plugin_dir_path( __DIR__ ) . 'build/index.asset.php';
		if ( ! file_exists( $asset_file_path ) ) {
			return;
		}
		$asset_file = include $asset_file_path;
		wp_enqueue_script(
			'gutenberg-collaborative-editing-editor-script',
			plugins_url( 'build/index.js', __DIR__ ),
			$asset_file['dependencies'],
			$asset_file['version'],
			true
		);
		wp_localize_script(
			'gutenberg-collaborative-editing-editor-script',
			'gceSync',
			array(
				'ajaxUrl' => admin_url( 'admin-ajax.php' ),
				'nonce' => wp_create_nonce( 'gutenberg_sync_nonce' ),
				'postId' => get_the_ID(),
				'currentUserId' => get_current_user_id(),
				'syncAction' => 'gce_sync_content',
				'pollAction' => 'gce_poll_content',
			)
		);

		if ( is_rtl() ) {
			wp_enqueue_style(
				'gutenberg-collaborative-editing-editor-style',
				plugins_url( 'build/style-index-rtl.css', __DIR__ ),
				[], $asset_file['version']
			);
		} else {
			wp_enqueue_style(
				'gutenberg-collaborative-editing-editor-style',
				plugins_url( 'build/style-index.css', __DIR__ ),
				[], $asset_file['version']
			);
		}

	}
}
