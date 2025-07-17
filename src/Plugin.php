<?php

namespace DotOrg\GCE;

use DotOrg\GCE\Ajax\AjaxRegistry;

class Plugin {
	public function __construct() {
		$this->includes();
		$this->init();
	}

	public function includes() {
		require_once __DIR__ . '/Persistence/AwarenessStateRepository.php';
		require_once __DIR__ . '/Persistence/ContentRepository.php';
		require_once __DIR__ . '/Ajax/AwarenessSyncHandler.php';
		require_once __DIR__ . '/Ajax/ContentSyncHandler.php';
		require_once __DIR__ . '/Ajax/PollingHandler.php';
		require_once __DIR__ . '/Ajax/AjaxRegistry.php';
		require_once __DIR__ . '/EditorAssets.php';
		require_once __DIR__ . '/Cron.php';
		require_once __DIR__ . '/HeartbeatListener.php';
	}

	public function init() {
		new AjaxRegistry();
		new EditorAssets();
		new HeartbeatListener();
	}
}
