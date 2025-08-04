<?php

namespace DotOrg\GCE;

use DotOrg\GCE\Ajax\AjaxRegistry;
use DotOrg\GCE\Admin\Settings;

class Plugin {
	public function __construct() {
		new AjaxRegistry();
		new EditorAssets();
		new HeartbeatListener();
		new Cron();

		if ( is_admin() ) {
			Settings::init();
		}
	}
}
