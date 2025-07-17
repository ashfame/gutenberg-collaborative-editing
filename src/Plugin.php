<?php

namespace DotOrg\GCE;

use DotOrg\GCE\Ajax\AjaxRegistry;

class Plugin {
	public function __construct() {
		new AjaxRegistry();
		new EditorAssets();
		new HeartbeatListener();
		new Cron();
	}
}
