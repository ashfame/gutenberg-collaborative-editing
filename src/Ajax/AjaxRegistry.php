<?php
namespace DotOrg\GCE\Ajax;

class AjaxRegistry {

	public function __construct() {
		add_action( 'wp_ajax_gce_sync_content', [ new ContentSyncHandler(), 'handle' ] );
		add_action( 'wp_ajax_gce_sync_awareness', [ new AwarenessSyncHandler(), 'handle' ] );
		add_action( 'wp_ajax_gce_poll', [ new PollingHandler(), 'handle' ] );
	}
} 