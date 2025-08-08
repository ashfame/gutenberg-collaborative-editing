<?php

namespace DotOrg\GCE\Ajax;

use DotOrg\GCE\Persistence\AwarenessStateRepository;
use DotOrg\GCE\Persistence\ContentRepository;

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
		$max_wait          = apply_filters( 'gce_long_poll_max_wait', 30, $post_id );
		$check_interval_ms = apply_filters( 'gce_long_poll_check_interval', 100, $post_id ); // Check every 100ms
		$start_time        = microtime( true );                                              // Use microtime for better precision

		$content_repo   = new ContentRepository();
		$awareness_repo = new AwarenessStateRepository();

		while ( ( microtime( true ) - $start_time ) < $max_wait ) {
			wp_cache_delete( $post_id, 'post_meta' ); // for Awareness

			$sync_data = $content_repo->get( $post_id );
			if (
				$sync_data &&
				$sync_data[ 'fingerprint' ] !== $fingerprint &&
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
}
