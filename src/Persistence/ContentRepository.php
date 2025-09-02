<?php

namespace DotOrg\GCE\Persistence;

use DotOrg\GCE\Utils;

class ContentRepository {

	public function save( $post_id, $user_id, $fingerprint, $content ) {
		$transient_key = "gce_sync_content_{$post_id}";
		$sync_data = [
			'content'     => $content,
			'timestamp'   => microtime( true ),
			'post_id'     => $post_id,
			'user_id'     => $user_id,
			'fingerprint' => $fingerprint,
			'snapshot_id' => Utils::generateFingerprint(),
		];
		set_transient( $transient_key, $sync_data, HOUR_IN_SECONDS );

		return [ $sync_data['snapshot_id'], $sync_data['timestamp'] ];
	}

	public function update_block( $post_id, $user_id, $fingerprint, $block_index, $content ) {
		$sync_data = $this->get( $post_id );

		if ( false === $sync_data ) {
			// ensure we have a full copy of the content
			$this->save(
				$post_id,
				$user_id,
				$fingerprint,
				get_post( $post_id )->post_content
			);
			$sync_data = $this->get( $post_id );
		}

		$parsed_blocks = array_values( array_filter(
			parse_blocks( $sync_data['content'] ?? '' ),
			function ( $block ) use ( $block_index ) {
				return !empty( $block['blockName'] );
			}
		) );

		$parsed_blocks[ $block_index ] = parse_blocks( $content )[0];

		return $this->save(
			$post_id,
			$user_id,
			$fingerprint,
			serialize_blocks( $parsed_blocks )
		);
	}

	public function get( $post_id ) {
		global $wpdb;

		$transient_key = "gce_sync_content_{$post_id}";

		// query directly to bypass in memory cache for transient
		$option_name = '_transient_' . $transient_key;
		$value       = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT option_value FROM $wpdb->options WHERE option_name = %s",
				$option_name
			)
		);
		return $value ? unserialize( $value ) : false;
	}

	public function cleanup() {
		global $wpdb;

		// cleanup expired transients
		$sql = "SELECT REPLACE(option_name, '_transient_timeout_', '') as transient_key "
			. "FROM {$wpdb->options} "
			. "WHERE option_name LIKE '_transient_timeout_gce_sync_content_%' "
			. "AND option_value < " . intval( time() );

		$transients = $wpdb->get_col( $sql );

		foreach ( $transients as $transient_key ) {
			delete_transient( $transient_key );
		}
	}
}
