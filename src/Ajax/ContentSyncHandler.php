<?php

namespace DotOrg\GCE\Ajax;

use DotOrg\GCE\Admin;
use DotOrg\GCE\Persistence\ContentRepository;
use DotOrg\GCE\Persistence\SnapshotIdRepository;

class ContentSyncHandler {

	public function handle() {
		check_ajax_referer( 'gce_sync_content', 'nonce' );

		$collaboration_mode = Admin\Settings::get()[ 'collaboration_mode' ];

		$post_id     = intval( $_POST[ 'post_id' ] ?? 0 );
		$block_index = intval( $_POST[ 'block_index' ] ?? -1 );
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

		if (
			$collaboration_mode === 'READ-ONLY-FOLLOW' &&
			wp_check_post_lock( $post_id )
		) {
			wp_send_json_error( [ 'message' => 'Post is locked by another user' ] );
		}

		$repo = new ContentRepository();

		if ( $block_index === -1 ) {
			$snapshot_id = $repo->save(
				$post_id,
				get_current_user_id(),
				$fingerprint,
				$content
			);
		} else {
			$snapshot_id = $repo->update_block(
				$post_id,
				get_current_user_id(),
				$fingerprint,
				$block_index,
				$content
			);
		}

		// Since the user saved the content, we treat this as a declaration of this state of content
		SnapshotIdRepository::save( $post_id, $snapshot_id );

		wp_send_json_success(
			[
				'timestamp'   => $repo->get_last_saved_at( $post_id ),
				'snapshot_id' => $snapshot_id,
				'message'     => 'Content synced successfully',
			]
		);
	}
}
