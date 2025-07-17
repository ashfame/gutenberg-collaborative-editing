<?php
namespace DotOrg\GCE\Ajax;

use DotOrg\GCE\Persistence\AwarenessStateRepository;

class AwarenessSyncHandler {
	public function handle() {
		check_ajax_referer( 'gce_sync_awareness', 'nonce' );

		$post_id = intval( $_POST['post_id'] ?? 0 );
		if ( ! $post_id || ! isset( $_POST['cursor_state'] ) ) {
			wp_send_json_error( [ 'message' => 'Invalid request data' ] );
		}

		$cursor_state = json_decode( wp_unslash( $_POST['cursor_state'] ), true );
		if ( JSON_ERROR_NONE !== json_last_error() ) {
			wp_send_json_error( [ 'message' => 'Malformed awareness data: ' . json_last_error_msg() ] );
		}

		$repo = new AwarenessStateRepository();
		$repo->update_user_awareness_state( get_current_user_id(), $post_id, $cursor_state );

		wp_send_json_success();
	}
}
