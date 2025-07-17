<?php
namespace DotOrg\GCE;

/**
 * Manages the state of collaborative editing sessions.
 */
class State {

	const POSTMETA_KEY_AWARENESS = 'gce_awareness';
	const INACTIVE_TIMEOUT = 240; // seconds

	public function __construct() {
		add_filter( 'heartbeat_received', [ $this, 'handle_heartbeat' ], 10, 2 );
	}

	public function get_inactive_timeout_value() {
		return apply_filter( 'gce_awareness_inactive_timeout', self::INACTIVE_TIMEOUT ); // TODO: add filter
	}

	/**
	 * @param array $awareness_state
	 * @return array Awareness state containing only active users
	 */
	private function filter_inactive_users( array $awareness_state ) : array {
		foreach ( $awareness_state as $user_id => $user_state ) {
			$active_threshold = $user_state['heartbeat_ts'] + $this->get_inactive_timeout_value();
			if ( $active_threshold < time() ) {
				unset( $awareness_state[ $user_id ] );
			}
		}

		return $awareness_state;
	}

	/**
	 * Handles the heartbeat request to update the user's active status.
	 *
	 * @param array $response The Heartbeat response.
	 * @param array $data     The data received from the front end.
	 * @return array The modified Heartbeat response.
	 */
	public function handle_heartbeat( $response, $data ) : array {
		if ( empty( $data['gce_post_id'] ) ) {
			return $response;
		}

		$post_id = intval( $data['gce_post_id'] );
		if ( ! $post_id || ! current_user_can( 'edit_post', $post_id ) ) {
			return $response;
		}

		$awareness_state = get_post_meta( $post_id, self::POSTMETA_KEY_AWARENESS, true );
		$user_id = get_current_user_id();

		if ( ! isset( $awareness_state[ $user_id ] ) ) {
			$awareness_state[ $user_id ] = [];
		}
		$awareness_state[ $user_id ][ 'heartbeat_ts' ] = time();

		update_post_meta( $post_id, self::POSTMETA_KEY_AWARENESS, $awareness_state );

		$response['gce_awareness'] = $awareness_state; // Note: currently unused, but we would most likely rely on this after some code improvements

		return $response;
	}

	/**
	 * Gets the users currently engaged in collaborative editing on a particular post.
	 *
	 * @param int $post_id The ID of the post.
	 * @return array An associative array of user_id => timestamp.
	 */
	public function get_active_users( $post_id ) {
		$awareness_state = get_post_meta( $post_id, self::POSTMETA_KEY_AWARENESS, true );
		return is_array( $awareness_state ) ? $this->filter_inactive_users( $awareness_state ) : [];
	}

	/**
	 * Checks if a post is currently being collaboratively edited.
	 *
	 * @param int $post_id The ID of the post.
	 * @return bool True if more than one user is active, false otherwise.
	 */
	public function is_collaborative_editing( $post_id ) : bool {
		$users = $this->get_active_users( $post_id );
		return count( $users ) > 1;
	}

	/**
	 * Gets a list of all posts currently being collaboratively edited.
	 * Note: This can be a slow query on sites with many posts.
	 * This would potentially be used for a dashboard widget
	 *
	 * @return int[] An array of post IDs.
	 */
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

		foreach ( $query->posts as $post_id ) {
			if ( $this->is_collaborative_editing( $post_id ) ) {
				$collaborative_posts[] = $post_id;
			}
		}

		return $collaborative_posts;
	}
} 