<?php

namespace DotOrg\GCE\Persistence;

class AwarenessStateRepository {

	const POSTMETA_KEY_AWARENESS = 'gce_awareness';
	const ACTIVITY_TIMEOUT = 240; // seconds

	public function update_user_cursor_state( $user_id, $post_id, $cursor_state ) {
		$awareness_state = $this->get( $post_id );
		if ( ! is_array( $awareness_state ) ) {
			$awareness_state = [];
		}
		$ts                          = time();
		$awareness_state[ $user_id ] = [
			'cursor_state' => $cursor_state,
			'cursor_ts'    => $ts,
			'heartbeat_ts' => $ts,
		];
		update_post_meta( $post_id, self::POSTMETA_KEY_AWARENESS, $awareness_state );
	}

	public function get( $post_id, $active_users_only = false ) {
		$stored = get_post_meta( $post_id, self::POSTMETA_KEY_AWARENESS, true ) ?? [];
		$state = $active_users_only ? $this->filter_inactive_users( $stored ) : $stored;
		foreach ( $state as $user_id => $user_state ) {
			$user = get_userdata( $user_id );
			$state[ $user_id ]['user'] = [
				'name' => $user->display_name ?: $user->user_login,
				'avatar' => get_avatar_url( $user_id, [ 'size' => 64, 'default' => 'mystery' ] ),
			];
		}
		return $state;
	}

	private function filter_inactive_users( array $awareness_state ) : array {
		foreach ( $awareness_state as $user_id => $user_state ) {
			$active_threshold = $user_state[ 'heartbeat_ts' ] + self::ACTIVITY_TIMEOUT;
			if ( $active_threshold < time() ) {
				unset( $awareness_state[ $user_id ] );
			}
		}

		return $awareness_state;
	}

	public function update_user_heartbeat( $user_id, $post_id ) {
		$awareness_state = $this->get( $post_id );
		if ( ! isset( $awareness_state[ $user_id ] ) ) {
			$awareness_state[ $user_id ] = [];
		}
		$awareness_state[ $user_id ][ 'heartbeat_ts' ] = time();
		update_post_meta( $post_id, self::POSTMETA_KEY_AWARENESS, $awareness_state );
	}

	public function is_outdated( $post_id, $user_id, $awareness_user ) : bool {
		$awareness_sys = $this->get( $post_id );

		unset( $awareness_user[ $user_id ] );
		unset( $awareness_sys[ $user_id ] );

		ksort( $awareness_user );
		ksort( $awareness_sys );

		return $awareness_user !== $awareness_sys;
	}

	public function get_active_posts() : array {
		$collaborative_posts = [];
		$args                = [
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

		$query = new WP_Query( $args );

		foreach ( $query->posts as $post_id ) {
			if ( $this->is_active( $post_id ) ) {
				$collaborative_posts[] = $post_id;
			}
		}

		return $collaborative_posts;
	}

	public function is_active( $post_id ) : bool {
		return count( $this->get( $post_id, true ) ) > 1;
	}
}
