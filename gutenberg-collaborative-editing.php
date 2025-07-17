<?php
/**
 * Plugin Name:       Gutenberg Collaborative Editing
 * Description:       A plugin to enhance Gutenberg with collaborative editing features.
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Version:           0.0.1
 * Author:            DotOrg
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       gutenberg-collaborative-editing
 *
 * @package           gce
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

require_once __DIR__ . '/src/Plugin.php';
require_once __DIR__ . '/src/Persistence/AwarenessStateRepository.php';
require_once __DIR__ . '/src/Persistence/ContentRepository.php';
require_once __DIR__ . '/src/Ajax/AwarenessSyncHandler.php';
require_once __DIR__ . '/src/Ajax/ContentSyncHandler.php';
require_once __DIR__ . '/src/Ajax/PollingHandler.php';
require_once __DIR__ . '/src/Ajax/AjaxRegistry.php';
require_once __DIR__ . '/src/EditorAssets.php';
require_once __DIR__ . '/src/Cron.php';
require_once __DIR__ . '/src/HeartbeatListener.php';

// Initialize the plugin.
add_action( 'init', function() {
	new \DotOrg\GCE\Plugin();
} );

register_activation_hook( __FILE__, function() {
	$cron = new \DotOrg\GCE\Cron();
	$cron->schedule_events();
} );
register_deactivation_hook( __FILE__, function() {
	$cron = new \DotOrg\GCE\Cron();
	$cron->unschedule_events();
} );
