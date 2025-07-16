<?php
namespace DotOrg\GCE;

class Engine {

	public function __construct() {
		add_action( 'enqueue_block_editor_assets', [ $this, 'enqueue_editor_assets' ] );
		add_action( 'gce_cleanup_transients_cron', [ $this, 'cron_cleanup' ] );
	}

	public function enqueue_editor_assets() {
		$asset_file_path = plugin_dir_path( __DIR__ ) . 'build/index.asset.php';
		if ( ! file_exists( $asset_file_path ) ) {
			return;
		}
		$asset_file = include $asset_file_path;
		$dependencies = $asset_file['dependencies'];
		if ( ! in_array( 'heartbeat', $dependencies, true ) ) {
			$dependencies[] = 'heartbeat';
		}
		wp_enqueue_script(
			'gutenberg-collaborative-editing-editor-script',
			plugins_url( 'build/index.js', __DIR__ ),
			$dependencies,
			$asset_file['version'],
			true
		);
		wp_localize_script(
			'gutenberg-collaborative-editing-editor-script',
			'gce',
			array(
				'ajaxUrl' => admin_url( 'admin-ajax.php' ),
				'postId' => get_the_ID(),
				'currentUserId' => get_current_user_id(),
				'gce_enabled' => true, // TODO: Introduce a filter here as per note in README
				'syncContentNonce' => wp_create_nonce( 'gce_sync_content' ),
				'syncAwarenessNonce' => wp_create_nonce( 'gce_sync_awareness' ),
				'pollNonce' => wp_create_nonce( 'gce_poll' ),
				'syncContentAction' => 'gce_sync_content',
				'syncAwarenessAction' => 'gce_sync_awareness',
				'pollAction' => 'gce_poll',
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

	public function cron_cleanup() {
		global $wpdb;

		// Find our transients that have expired.
		$sql = "SELECT REPLACE(option_name, '_transient_timeout_', '') as transient_key FROM {$wpdb->options} WHERE option_name LIKE '_transient_timeout_gce_sync_content_%' AND option_value < " . intval( time() );
		$transients = $wpdb->get_col( $sql );

		foreach ( $transients as $transient_key ) {
			delete_transient( $transient_key );
		}
	}
}
