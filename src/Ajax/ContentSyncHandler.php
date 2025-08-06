<?php

namespace DotOrg\GCE\Ajax;

use DotOrg\GCE\Persistence\ContentRepository;

class ContentSyncHandler {

	public function handle() {
		check_ajax_referer( 'gce_sync_content', 'nonce' );

		$post_id     = intval( $_POST[ 'post_id' ] ?? 0 );
		$fingerprint = $_POST[ 'fingerprint' ] ?? null;
		$content     = json_decode(
			wp_unslash( $_POST[ 'content' ] ?? '{}' ),
			true
		);

		if ( ! $post_id || ! $content ) {
			wp_send_json_error( [ 'message' => 'Invalid request data' ] );
		}

		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			wp_send_json_error( [ 'message' => 'Permission denied' ] );
		}

		if ( wp_check_post_lock( $post_id ) ) {
			wp_send_json_error( [ 'message' => 'Post is locked by another user' ] );
		}

		$repo = new ContentRepository();
		$repo->save( $post_id, get_current_user_id(), $fingerprint, $content );

		wp_send_json_success(
			[
				'timestamp' => microtime( true ),
				'message'   => 'Content synced successfully',
			]
		);
	}
}
