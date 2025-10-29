<?php

namespace DotOrg\GCE\Ajax;

use DotOrg\GCE\Persistence\AwarenessStateRepository;
use DotOrg\GCE\Persistence\ContentRepository;
use DotOrg\GCE\Persistence\SnapshotIdRepository;

class PollingHandler {

	public function handle() {
		check_ajax_referer( 'gce_poll', 'nonce' );

		$post_id        = intval( $_GET[ 'post_id' ] ?? 0 );
		$last_timestamp = floatval( $_GET[ 'last_timestamp' ] ?? 0 );
		$fingerprint    = $_GET['fingerprint'] ?? null;

		$awareness_user = [];
		if ( isset( $_GET[ 'awareness' ] ) ) {
			$awareness_json = wp_unslash( $_GET[ 'awareness' ] );
			$decoded_data   = json_decode( $awareness_json, true ) ?? [];
			if ( json_last_error() === JSON_ERROR_NONE ) {
				$awareness_user = $decoded_data;
			} else {
				wp_send_json_error( [ 'message' => 'Invalid awareness data' ] );
			}
		}

		if ( ! $post_id ) {
			wp_send_json_error( [ 'message' => 'Missing post_id' ] );
		}

		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			wp_send_json_error( [ 'message' => 'Permission denied' ] );
		}

		// Long polling implementation
		$available_time = $this->get_available_execution_time( $post_id );
		$desired_wait   = apply_filters( 'gce_long_poll_max_wait', $available_time, $post_id );
		$max_wait       = min( $desired_wait, $available_time );

		$check_interval_ms = apply_filters( 'gce_long_poll_check_interval', 100, $post_id ); // Check every 100ms
		$start_time        = microtime( true );                                              // Use microtime for better precision

		$content_repo   = new ContentRepository();
		$awareness_repo = new AwarenessStateRepository();

		$declared_snaphost_ids = SnapshotIdRepository::get( $post_id );

		while ( ( microtime( true ) - $start_time ) < $max_wait ) {
			wp_cache_delete( $post_id, 'post_meta' ); // for Awareness

			$sync_data = $content_repo->get_or_init(
				$post_id,
				get_current_user_id(),
				$fingerprint
			);
			if (
				$sync_data &&
				(
					$sync_data[ 'fingerprint' ] !== $fingerprint ||
					(
						isset( $declared_snaphost_ids[
							get_current_user_id()
						] ) &&
						$declared_snaphost_ids[
							get_current_user_id()
						] !== $sync_data[ 'snapshot_id']
					)
				) &&
				floatval( $sync_data[ 'timestamp' ] ) > $last_timestamp
			) {
				wp_send_json_success(
					[
						'modified'  => true,
						'content'   => $sync_data,
						'awareness' => $awareness_repo->get( $post_id ),
					]
				);
			}

			// let's see if there is just awareness update that we can respond with
			if ( $awareness_repo->is_outdated( $post_id, get_current_user_id(), $awareness_user ) ) {
				wp_send_json_success(
					[
						'modified'  => false,
						'content'   => null,
						'awareness' => $awareness_repo->get( $post_id ),
					]
				);
			}

			usleep( $check_interval_ms * 1000 ); // usleep takes microseconds
		}

		// No update found within timeout window, let client re-connect
		wp_send_json_success( null, 204 );
	}

	/**
	 * Calculates the available execution time for the request.
	 *
	 * @return int The available time in seconds.
	 */
	private function get_available_execution_time() : int {
		$max_execution_time = (int) ini_get( 'max_execution_time' );

		// If there's no execution time limit, we can theoretically wait forever.
		// Return a very large number to represent this.
		if ( $max_execution_time <= 0 ) {
			return PHP_INT_MAX;
		}

		// Leave a few seconds of buffer to allow for shutdown tasks.
		$safety_buffer = apply_filters( 'gce_long_poll_safety_buffer', 5 );

		// Determine the request start time.
		$request_start_time = filter_var( $_SERVER['REQUEST_TIME_FLOAT'], FILTER_VALIDATE_FLOAT );
		$request_start_time = $request_start_time ?: microtime( true );

		// If we couldn't determine the start time, we can't safely calculate the remaining time.
		// In this case, we conservatively return 0.
		if ( ! $request_start_time ) {
			return 0;
		}

		// Calculate elapsed time since the request started.
		$elapsed_time = microtime( true ) - $request_start_time;

		// Calculate the maximum time we can wait from now on.
		$available_time = $max_execution_time - $elapsed_time - $safety_buffer;

		// Ensure we don't have a negative wait time.
		return (int) max( 0, $available_time );
	}
}
