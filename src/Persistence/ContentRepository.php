<?php

namespace DotOrg\GCE\Persistence;

use DotOrg\GCE\Utils;

class ContentRepository {

	public function save( $post_id, $user_id, $fingerprint, $content, $title ) : array {
		$transient_key = "gce_sync_content_{$post_id}";
		$sync_data = [
			'content'     => [ 'html' => $content, 'title' => $title ],
			'timestamp'   => Utils::getTimestamp(),
			'post_id'     => $post_id,
			'user_id'     => $user_id,
			'fingerprint' => $fingerprint,
			'snapshot_id' => Utils::generateFingerprint(),
		];
		set_transient( $transient_key, $sync_data, HOUR_IN_SECONDS );

		return [ $sync_data['snapshot_id'], $sync_data['timestamp'] ];
	}

	public function add_block( $post_id, $user_id, $fingerprint, $block_index, $block_content ) : array {
		$sync_data = $this->get_or_init( $post_id, $user_id, $fingerprint );

		$parsed_blocks = $this->get_parsed_blocks( $sync_data );

		$new_block = parse_blocks( $block_content )[0] ?? null;
		if ( $new_block ) {
			array_splice( $parsed_blocks, $block_index, 0, [ $new_block ] );
		}

		return $this->save(
			$post_id,
			$user_id,
			$fingerprint,
			serialize_blocks( $parsed_blocks ),
			$sync_data['content']['title'] ?? get_the_title( $post_id )
		);
	}

	public function update_block( $post_id, $user_id, $fingerprint, $block_index, $block_content ) : array {
		$sync_data = $this->get_or_init( $post_id, $user_id, $fingerprint );

		$parsed_blocks = $this->get_parsed_blocks( $sync_data );

		$parsed_blocks[ $block_index ] = parse_blocks( $block_content )[0];

		return $this->save(
			$post_id,
			$user_id,
			$fingerprint,
			serialize_blocks( $parsed_blocks ),
			$sync_data['content']['title'] ?? get_the_title( $post_id )
		);
	}

	public function move_block( $post_id, $user_id, $fingerprint, $from_index, $to_index ) : array {
		$sync_data = $this->get_or_init( $post_id, $user_id, $fingerprint );

		$parsed_blocks = $this->get_parsed_blocks( $sync_data );

		$block_to_move = array_splice( $parsed_blocks, $from_index, 1 );
		if ( ! empty( $block_to_move ) ) {
			array_splice( $parsed_blocks, $to_index, 0, $block_to_move );
		}

		return $this->save(
			$post_id,
			$user_id,
			$fingerprint,
			serialize_blocks( $parsed_blocks ),
			$sync_data['content']['title'] ?? get_the_title( $post_id )
		);
	}

	public function delete_block( $post_id, $user_id, $fingerprint, $block_index ) : array {
		$sync_data = $this->get_or_init( $post_id, $user_id, $fingerprint );

		$parsed_blocks = $this->get_parsed_blocks( $sync_data );

		if ( isset( $parsed_blocks[ $block_index ] ) ) {
			array_splice( $parsed_blocks, $block_index, 1 );
		}

		return $this->save(
			$post_id,
			$user_id,
			$fingerprint,
			serialize_blocks( $parsed_blocks ),
			$sync_data['content']['title'] ?? get_the_title( $post_id )
		);
	}

	public function update_title( $post_id, $user_id, $fingerprint, $title ) : array {
		$sync_data = $this->get_or_init( $post_id, $user_id, $fingerprint );
		
		return $this->save(
			$post_id,
			$user_id,
			$fingerprint,
			$sync_data['content']['html'] ?? '',
			$title
		);
	}

	public function get_or_init( $post_id, $user_id, $fingerprint, $title = null ) {
		$sync_data = $this->get( $post_id );

		if ( false === $sync_data ) {
			// ensure we have a full copy of the content
			$post = get_post( $post_id );
			$this->save(
				$post_id,
				$user_id,
				$fingerprint,
				$post->post_content,
				$title ?? $post->post_title
			);
			$sync_data = $this->get( $post_id );
		}
		return $sync_data;
	}

	private function get_parsed_blocks( $sync_data ) {
		return array_values(
			array_filter(
				parse_blocks( $sync_data['content']['html'] ?? '' ),
				function ( $block ) {
					return ! empty( $block['blockName'] );
				}
			)
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
