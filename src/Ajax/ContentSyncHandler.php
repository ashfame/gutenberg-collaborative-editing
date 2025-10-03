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
		$fingerprint = $_POST[ 'fingerprint' ] ?? null;
		
		// Only validate JSON payload for 'full' and 'ops' types
		if ( isset( $_POST[ 'payloadType' ] ) && $_POST[ 'payloadType' ] === 'title' ) {
			$payload = $_POST[ 'payload' ] ?? '';
			if ( empty( $payload ) ) {
				wp_send_json_error( [ 'message' => 'Invalid request data' ] );
			}
		} else {
			$payload = json_decode(
				wp_unslash( $_POST[ 'payload' ] ?? '{}' ),
				true
			);
			if ( ! $post_id || ! $payload ) {
				wp_send_json_error( [ 'message' => 'Invalid request data' ] );
			}
		}

		if ( ! $post_id ) {
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

		if ( isset( $_POST[ 'payloadType' ] ) && $_POST[ 'payloadType' ] === 'ops' ) {
			$block_ops = json_decode( wp_unslash( $_POST[ 'payload' ] ), true );

			if ( ! is_array( $block_ops ) ) {
				wp_send_json_error( [ 'message' => 'Invalid block operations data' ] );
			}

			foreach ( $block_ops as $block_op ) {
				if ( ! is_array( $block_op ) || ! isset( $block_op[ 'op' ] ) ) {
					wp_send_json_error( [ 'message' => 'Invalid block operation data in batch' ] );
				}

				switch ( $block_op[ 'op' ] ) {
					case 'insert':
						[ $snapshot_id, $saved_at_ts ] = $repo->add_block(
							$post_id,
							get_current_user_id(),
							$fingerprint,
							$block_op[ 'blockIndex' ],
							$block_op[ 'blockContent' ]
						);
						break;
					case 'update':
						[ $snapshot_id, $saved_at_ts ] = $repo->update_block(
							$post_id,
							get_current_user_id(),
							$fingerprint,
							$block_op[ 'blockIndex' ],
							$block_op[ 'blockContent' ]
						);
						break;
					case 'move':
						[ $snapshot_id, $saved_at_ts ] = $repo->move_block(
							$post_id,
							get_current_user_id(),
							$fingerprint,
							$block_op[ 'fromBlockIndex' ],
							$block_op[ 'toBlockIndex' ]
						);
						break;
					case 'del':
						[ $snapshot_id, $saved_at_ts ] = $repo->delete_block(
							$post_id,
							get_current_user_id(),
							$fingerprint,
							$block_op[ 'blockIndex' ]
						);
						break;
					default:
						wp_send_json_error( [ 'message' => 'Unknown block operation' ] );
				}
			}
		} else if ( isset( $_POST[ 'payloadType' ] ) && $_POST[ 'payloadType' ] === 'full' ) {
			$content = json_decode( wp_unslash( $_POST[ 'payload' ] ), true );
			if ( ! $content ) {
				wp_send_json_error( [ 'message' => 'Invalid request data' ] );
			}
			[ $snapshot_id, $saved_at_ts ] = $repo->save(
				$post_id,
				get_current_user_id(),
				$fingerprint,
				$content[ 'html' ],
				$content[ 'title' ]
			);
		} else if ( isset( $_POST[ 'payloadType' ] ) && $_POST[ 'payloadType' ] === 'title' ) {
			$title = $_POST[ 'payload' ] ?? '';
			
			// Security checks for title
			if ( empty( $title ) ) {
				wp_send_json_error( [ 'message' => 'Title cannot be empty' ] );
			}
			
			// Sanitize the title
			$title = sanitize_text_field( $title );
			
			// Validate title length (WordPress default is 255 characters)
			if ( strlen( $title ) > 255 ) {
				wp_send_json_error( [ 'message' => 'Title is too long (maximum 255 characters)' ] );
			}
			
			// Check if title contains only valid characters (no HTML/scripts)
			if ( $title !== wp_strip_all_tags( $title ) ) {
				wp_send_json_error( [ 'message' => 'Title contains invalid characters' ] );
			}
			
			// Additional security: Check for potential XSS attempts
			if ( preg_match( '/<script|javascript:|on\w+\s*=/i', $title ) ) {
				wp_send_json_error( [ 'message' => 'Title contains potentially malicious content' ] );
			}
			
			[ $snapshot_id, $saved_at_ts ] = $repo->update_title(
				$post_id,
				get_current_user_id(),
				$fingerprint,
				$title
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
