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
		$block_index = isset( $_POST[ 'block_index' ] )
			? intval( $_POST[ 'block_index' ] )
			: null;
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

		if ( isset( $_POST['block_op'] ) ) {
			$block_op = json_decode( wp_unslash( $_POST['block_op'] ), true );

			if ( ! $block_op || ! isset( $block_op['op'] ) ) {
				wp_send_json_error( [ 'message' => 'Invalid block operation data' ] );
			}

			switch ( $block_op['op'] ) {
				case 'insert':
					[ $snapshot_id, $saved_at_ts ] = $repo->add_block(
						$post_id,
						get_current_user_id(),
						$fingerprint,
						$block_op['blockIndex'],
						$block_op['blockContent']
					);
					break;
				case 'update':
					[ $snapshot_id, $saved_at_ts ] = $repo->update_block(
						$post_id,
						get_current_user_id(),
						$fingerprint,
						$block_op['blockIndex'],
						$block_op['blockContent'],
						null // title is not sent for block-level updates.
					);
					break;
				case 'move':
					[ $snapshot_id, $saved_at_ts ] = $repo->move_block(
						$post_id,
						get_current_user_id(),
						$fingerprint,
						$block_op['fromBlockIndex'],
						$block_op['toBlockIndex']
					);
					break;
				case 'del':
					[ $snapshot_id, $saved_at_ts ] = $repo->delete_block(
						$post_id,
						get_current_user_id(),
						$fingerprint,
						$block_op['blockIndex']
					);
					break;
				default:
					wp_send_json_error( [ 'message' => 'Unknown block operation' ] );
			}
		} elseif ( isset( $_POST['content'] ) ) {
			$content = json_decode( wp_unslash( $_POST['content'] ), true );
			if ( ! $content ) {
				wp_send_json_error( [ 'message' => 'Invalid request data' ] );
			}
			[ $snapshot_id, $saved_at_ts ] = $repo->save(
				$post_id,
				get_current_user_id(),
				$fingerprint,
				$content['html'],
				$content['title']
			);
		} else {
			wp_send_json_error( [ 'message' => 'Invalid request data' ] );
		}

		// Since the user saved the content, we treat this as a declaration of this state of content
		SnapshotIdRepository::save( $post_id, $snapshot_id );

		wp_send_json_success(
			[
				'timestamp'   => $saved_at_ts,
				'snapshot_id' => $snapshot_id,
				'message'     => 'Content synced successfully',
			]
		);
	}
}
