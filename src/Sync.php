<?php
namespace DotOrg\GCE;

class Sync {

	public function __construct() {
		add_action( 'wp_ajax_gce_sync_content', [ $this, 'handle_content_sync' ] );
		add_action( 'wp_ajax_gce_sync_awareness', [ $this, 'handle_awareness_sync' ] );
		add_action( 'wp_ajax_gce_poll', [ $this, 'handle_polling' ] );
	}

	private function get_latest_awareness_state( $post_id ) {
		return get_post_meta( $post_id, 'gce_awareness', true ) ?? [];
	}

	/**
	 * Compare awareness state of all users for the current user, as the current user is aware of vs as the system knows
	 *
	 * @param $post_id
	 * @param $awareness_user
	 * @return bool
	 */
	private function awareness_update_available( $post_id, $awareness_user ) : bool {
		$current_user_id = get_current_user_id();
		$awareness_sys = get_post_meta( $post_id, 'gce_awareness', true );

		unset( $awareness_user[ $current_user_id ] );
		unset( $awareness_sys[ $current_user_id ] );

		ksort( $awareness_user );
		ksort( $awareness_sys );

		return $awareness_user !== $awareness_sys;
	}

	private function return_success_response( $data = null, $status_code = null ) {
		wp_send_json_success( $data, $status_code );
		return; // unreachable since we die() in wp_send_json_success(), just added for readability
	}

	private function return_error_response( $data = null ) {
		wp_send_json_error( $data );
		return; // unreachable since we die() in wp_send_json_error(), just added for readability
	}

	public function handle_content_sync() {
		check_ajax_referer( 'gce_sync_content', 'nonce' );

		$post_id = intval( $_POST['post_id'] ?? 0 );
		$content = json_decode( wp_unslash( $_POST['content'] ?? '{}' ), true );

		if ( ! $post_id || ! $content ) {
			$this->return_error_response( array( 'message' => 'Invalid request data' ) );
		}

		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			$this->return_error_response( array( 'message' => 'Permission denied' ) );
		}

		if ( wp_check_post_lock( $post_id ) ) {
			$this->return_error_response( array( 'message' => 'Post is locked by another user' ) );
		}

		// Store content in transient (expires in 1 hour) to minimize bloat risk
		$transient_key = "gce_sync_content_{$post_id}";
		$sync_data = array(
			'content' => $content,
			'timestamp' => time(),
			'post_id' => $post_id,
			'user_id' => get_current_user_id()
		);
		set_transient( $transient_key, $sync_data, HOUR_IN_SECONDS );

		$this->return_success_response( array(
			'timestamp' => time(),
			'message' => 'Content synced successfully'
		) );
	}

	public function handle_awareness_sync() {
		check_ajax_referer( 'gce_sync_awareness', 'nonce' );

		$post_id = intval( $_POST['post_id'] ?? 0 );
		if ( ! $post_id || ! isset( $_POST['cursor_state'] ) ) {
			$this->return_error_response( array( 'message' => 'Invalid request data' ) );
		}

		$cursor_state = json_decode( wp_unslash( $_POST['cursor_state'] ), true );
		if ( JSON_ERROR_NONE !== json_last_error() ) {
			$this->return_error_response( array( 'message' => 'Malformed awareness data: ' . json_last_error_msg() ) );
		}

		$awareness_state = get_post_meta( $post_id, 'gce_awareness', true );
		if ( ! is_array( $awareness_state ) ) {
			$awareness_state = [];
		}
		$awareness_state[ get_current_user_id() ] = [
			'cursor_state'  => $cursor_state,
			'ts' => time()
		];
		update_post_meta( $post_id, 'gce_awareness', $awareness_state );

		$this->return_success_response();
	}

	public function handle_polling() {
		check_ajax_referer( 'gce_poll', 'nonce' );

		$post_id = intval( $_GET['post_id'] ?? 0 );
		$last_timestamp = intval( $_GET['last_timestamp'] ?? 0 );
		$lock_owner = ! wp_check_post_lock( $post_id );

		$awareness_user = [];
		if ( isset( $_GET['awareness'] ) ) {
			$awareness_json = wp_unslash( $_GET['awareness'] );
			$decoded_data = json_decode( $awareness_json, true ) ?? [];
			if ( json_last_error() === JSON_ERROR_NONE ) {
				$awareness_user = $decoded_data;
			} else {
				$this->return_error_response( array( 'message' => 'Invalid awareness data' ) );
			}
		}

		if ( ! $post_id ) {
			$this->return_error_response( array( 'message' => 'Missing post_id' ) );
		}

		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			$this->return_error_response( array( 'message' => 'Permission denied' ) );
		}

		// Long polling implementation
		$max_wait = apply_filters( 'gce_long_poll_max_wait', 30, $post_id );
		$check_interval_ms = apply_filters( 'gce_long_poll_check_interval', 100, $post_id ); // Check every 100ms
		$start_time = microtime(true); // Use microtime for better precision

		while ( ( microtime(true) - $start_time ) < $max_wait ) {
			wp_cache_delete( $post_id, 'post_meta' ); // for Awareness
			if ( ! $lock_owner ) {
				$transient_key = "gce_sync_content_{$post_id}";

				// Directly query the database to bypass any caching layers.
				global $wpdb;
				$option_name = '_transient_' . $transient_key;
				$value = $wpdb->get_var( $wpdb->prepare( "SELECT option_value FROM $wpdb->options WHERE option_name = %s", $option_name ) );
				$sync_data = $value ? unserialize( $value ) : false;

				if ( $sync_data && $sync_data['timestamp'] > $last_timestamp ) {
					$this->return_success_response( array(
						'modified' => true,
						'content' => $sync_data,
						'awareness' => $this->get_latest_awareness_state( $post_id )
					) );
				}
			}

			// let's see if there is just awareness update that we can respond with
			if ( $this->awareness_update_available( $post_id, $awareness_user ) ) {
				$this->return_success_response( array(
					'modified' => false,
					'content' => null,
					'awareness' => $this->get_latest_awareness_state( $post_id )
				) );
			}

			usleep( $check_interval_ms * 1000 ); // usleep takes microseconds
		}

		// No update found within timeout window, let client re-connect
		$this->return_success_response( null, 204 );
	}
}
