<?php
namespace DotOrg\GCE;

/**
 * Manages the state of collaborative editing sessions.
 */
class State {

	const META_KEY_ACTIVE_USERS = 'gce_active_users';
	const INACTIVE_TIMEOUT = 240; // seconds

	public function __construct() {
		add_filter( 'heartbeat_received', [ $this, 'handle_heartbeat' ], 10, 2 );
	}

	private function filter_inactive_users( $users ) {
		foreach ( $users as $user_id => $time ) {
			if ( $time + self::INACTIVE_TIMEOUT < time() ) {
				unset( $users[ $user_id ] );
			}
		}

		return $users;
	}

	/**
	 * Handles the heartbeat request to update the user's active status.
	 *
	 * @param array $response The Heartbeat response.
	 * @param array $data     The data received from the front end.
	 * @return array The modified Heartbeat response.
	 */
	public function handle_heartbeat( $response, $data ) {
		if ( empty( $data['gce_post_id'] ) ) {
			return $response;
		}

		$post_id = intval( $data['gce_post_id'] );
		if ( ! $post_id || ! current_user_can( 'edit_post', $post_id ) ) {
			return $response;
		}

		$active_users = $this->get_active_users( $post_id );
		$active_users[ get_current_user_id() ] = time();
		update_post_meta( $post_id, self::META_KEY_ACTIVE_USERS, $active_users );

		$response['gce_awareness'] = $active_users; // Note: currently unused, but we would most likely rely on this after some code improvements

		return $response;
	}

	/**
	 * Gets the users currently engaged in collaborative editing on a particular post.
	 *
	 * @param int $post_id The ID of the post.
	 * @return array An associative array of user_id => timestamp.
	 */
	public function get_active_users( $post_id ) {
		$users = get_post_meta( $post_id, self::META_KEY_ACTIVE_USERS, true );
		return is_array( $users ) ? $this->filter_inactive_users( $users ) : [];
	}

	/**
	 * Checks if a post is currently being collaboratively edited.
	 *
	 * @param int $post_id The ID of the post.
	 * @return bool True if more than one user is active, false otherwise.
	 */
	public function is_collaborative_editing( $post_id ) {
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
	public function get_collaborative_posts() {
		$collaborative_posts = [];
		$args = [
			'post_type'      => 'any',
			'posts_per_page' => -1,
			'fields'         => 'ids',
			'meta_query'     => [
				[
					'key'     => self::META_KEY_ACTIVE_USERS,
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