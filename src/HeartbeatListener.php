<?php

namespace DotOrg\GCE;

use DotOrg\GCE\Persistence\AwarenessStateRepository;

class HeartbeatListener {
	public function __construct() {
		add_filter( 'heartbeat_received', [ $this, 'handle' ], 10, 2 );
	}

	public function handle( $response, $data ) : array {
		if ( empty( $data[ 'gce_post_id' ] ) ) {
			return $response;
		}

		$post_id = intval( $data[ 'gce_post_id' ] );
		if ( ! $post_id || ! current_user_can( 'edit_post', $post_id ) ) {
			return $response;
		}

		$repo = new AwarenessStateRepository();
		$repo->update_user_heartbeat( get_current_user_id(), $post_id );

		$response[ 'gce_awareness' ] = $repo->get( $post_id );

		return $response;
	}
}
