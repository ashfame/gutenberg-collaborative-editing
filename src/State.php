<?php
namespace DotOrg\GCE;

use DotOrg\GCE\Persistence\AwarenessStateRepository;

/**
 * Manages the state of collaborative editing sessions.
 */
class State {
	const INACTIVE_TIMEOUT = 240; // seconds

	/**
	 * @var AwarenessStateRepository
	 */
	private $awareness_repo;

	public function __construct() {
		$this->awareness_repo = new AwarenessStateRepository();
	}

	public function get_inactive_timeout_value() {
		return apply_filters( '', self::INACTIVE_TIMEOUT ); // TODO: add filter
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
	 * Gets the users currently engaged in collaborative editing on a particular post.
	 *
	 * @param int $post_id The ID of the post.
	 * @return array An associative array of user_id => timestamp.
	 */
	public function get_active_users( $post_id ) {
		$awareness_state = $this->awareness_repo->get_awareness_state_for_post( $post_id );
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
		return $this->awareness_repo->get_collaborative_posts();
	}
} 