<?php

namespace DotOrg\GCE\Persistence;

class SnapshotIdRepository {

	private static $POST_META_KEY = 'gce_declared_snapshot_ids';

	public static function get( $post_id ) {
		$data = get_post_meta( $post_id, self::$POST_META_KEY, true );
		if ( ! is_array( $data ) ) {
			$data = [];
		}
		return $data;
	}

	public static function getOwn( $post_id ) {
		$user_id = get_current_user_id();

		$data = get_post_meta( $post_id, self::$POST_META_KEY, true );
		if ( ! isset( $data[ $user_id ] ) ) {
			return null;
		}
		return $data[ $user_id ];
	}

	/**
	 * Update the snapshot id for the current user
	 *
	 * @param $post_id
	 * @param $snapshot_id
	 * @return void
	 */
	public static function save( $post_id, $snapshot_id ) {
		$user_id = get_current_user_id();

		$data = get_post_meta( $post_id, self::$POST_META_KEY, true );
		if ( !is_array( $data ) ) {
			$data = [];
		}

		$data[ $user_id ] = $snapshot_id;
	}

}
