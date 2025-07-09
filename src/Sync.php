<?php
namespace DotOrg\GCE;

class Sync {

	public function __construct() {
		add_action( 'wp_ajax_gce_sync_content', [ $this, 'handle_sync' ] );
		add_action( 'wp_ajax_gce_poll_updates', [ $this, 'poll_updates' ] );
		add_action( 'gce_cleanup_transients_cron', [ $this, 'cron_cleanup' ] );
	}

	public function handle_sync() {
		check_ajax_referer( 'gce_long_poll', 'nonce' );

		$post_id = intval( $_POST['post_id'] ?? 0 );
		$content = json_decode( wp_unslash( $_POST['content'] ?? '{}' ), true );

		if ( ! $post_id || ! $content ) {
			wp_send_json_error( array( 'message' => 'Invalid request data' ) );
			return; // unreachable since we die() in wp_send_json_error(), just added for readability
		}

		// Verify user has lock on this post
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			wp_send_json_error( array( 'message' => 'Permission denied' ) );
			return; // unreachable since we die() in wp_send_json_error(), just added for readability
		}

		$lock = wp_check_post_lock( $post_id );
		if ( $lock ) {
			wp_send_json_error( array( 'message' => 'Post is locked by another user' ) );
			return; // unreachable since we die() in wp_send_json_error(), just added for readability
		}

		// Store content in transient (expires in 1 hour)
		$transient_key = "gce_sync_content_{$post_id}";
		$sync_data = array(
			'content' => $content,
			'timestamp' => time(),
			'post_id' => $post_id,
			'user_id' => get_current_user_id()
		);
		set_transient( $transient_key, $sync_data, HOUR_IN_SECONDS );

		wp_send_json_success( array(
			'timestamp' => time(),
			'message' => 'Content synced successfully'
		) );
	}

	public function poll_updates() {
		check_ajax_referer( 'gce_long_poll', 'nonce' );

		$post_id = intval( $_GET['post_id'] ?? 0 );
		$last_timestamp = intval( $_GET['last_timestamp'] ?? 0 );

		if ( ! $post_id ) {
			wp_send_json_error( array( 'message' => 'Missing post_id' ) );
			return; // unreachable since we die() in wp_send_json_error(), just added for readability
		}

		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			wp_send_json_error( array( 'message' => 'Permission denied' ) );
			return; // unreachable since we die() in wp_send_json_error(), just added for readability
		}

		// Long polling implementation
		$max_wait = 30; // 30 seconds max wait
		$check_interval = 0.1; // Check every 100ms for much faster response
		$start_time = microtime(true); // Use microtime for better precision

		while ( ( microtime(true) - $start_time ) < $max_wait ) {
			$transient_key = "gce_sync_content_{$post_id}";

			// Directly query the database to bypass any caching layers.
			global $wpdb;
			$option_name = '_transient_' . $transient_key;
			$value = $wpdb->get_var( $wpdb->prepare( "SELECT option_value FROM $wpdb->options WHERE option_name = %s", $option_name ) );
			$sync_data = $value ? unserialize( $value ) : false;

			if ( $sync_data && $sync_data['timestamp'] > $last_timestamp ) {
				wp_send_json_success( array(
					'content' => $sync_data,
					'modified' => true
				) );
				return; // unreachable since we die() in wp_send_json_success(), just added for readability
			}

			// Sleep for check interval to prevent excessive CPU usage
			usleep( $check_interval * 1000000 ); // usleep takes microseconds
		}

		// No update found within timeout window
		wp_send_json_success( array(
			'content' => null,
			'modified' => false
		) );
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
