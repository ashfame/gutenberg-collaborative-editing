<?php
namespace DotOrg\GCE\Persistence;

class AwarenessStateRepository {

	const POSTMETA_KEY_AWARENESS = 'gce_awareness';

	public function get_awareness_state_for_post( $post_id ) {
		return get_post_meta( $post_id, self::POSTMETA_KEY_AWARENESS, true ) ?? [];
	}

	public function update_user_awareness_state( $user_id, $post_id, $cursor_state ) {
		$awareness_state = $this->get_awareness_state_for_post( $post_id );
		if ( ! is_array( $awareness_state ) ) {
			$awareness_state = [];
		}
		$ts = time();
		$awareness_state[ $user_id ] = [
			'cursor_state' => $cursor_state,
			'cursor_ts'    => $ts,
			'heartbeat_ts' => $ts,
		];
		update_post_meta( $post_id, self::POSTMETA_KEY_AWARENESS, $awareness_state );
	}

	public function update_user_heartbeat( $user_id, $post_id ) {
		$awareness_state = $this->get_awareness_state_for_post( $post_id );
		if ( ! isset( $awareness_state[ $user_id ] ) ) {
			$awareness_state[ $user_id ] = [];
		}
		$awareness_state[ $user_id ]['heartbeat_ts'] = time();
		update_post_meta( $post_id, self::POSTMETA_KEY_AWARENESS, $awareness_state );
		return $awareness_state;
	}

	public function is_awareness_update_available( $post_id, $user_id, $awareness_user ) : bool {
		$awareness_sys = $this->get_awareness_state_for_post( $post_id );

		unset( $awareness_user[ $user_id ] );
		unset( $awareness_sys[ $user_id ] );

		ksort( $awareness_user );
		ksort( $awareness_sys );

		return $awareness_user !== $awareness_sys;
	}

	public function get_collaborative_posts() : array {
		$collaborative_posts = [];
		$args = [
			'post_type'      => 'any',
			'posts_per_page' => -1,
			'fields'         => 'ids',
			'meta_query'     => [
				[
					'key'     => self::POSTMETA_KEY_AWARENESS,
					'compare' => 'EXISTS',
				],
			],
		];
		$query = new \WP_Query( $args );

		$state = new \DotOrg\GCE\State();
		foreach ( $query->posts as $post_id ) {
			if ( $state->is_collaborative_editing( $post_id ) ) {
				$collaborative_posts[] = $post_id;
			}
		}

		return $collaborative_posts;
	}
} 