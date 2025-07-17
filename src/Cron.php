<?php

namespace DotOrg\GCE;

use DotOrg\GCE\Persistence\ContentRepository;

class Cron {
	public function __construct() {
		add_action( 'gce_cleanup_transients_cron', [ $this, 'cleanup' ] );
	}

	public function schedule_events() {
		if ( ! wp_next_scheduled( 'gce_cleanup_transients_cron' ) ) {
			wp_schedule_event( time(), 'daily', 'gce_cleanup_transients_cron' );
		}
	}

	public function unschedule_events() {
		$timestamp = wp_next_scheduled( 'gce_cleanup_transients_cron' );
		if ( $timestamp ) {
			wp_unschedule_event( $timestamp, 'gce_cleanup_transients_cron' );
		}
	}

	public function cleanup() {
		$repo = new ContentRepository();
		$repo->cleanup();
	}
}
