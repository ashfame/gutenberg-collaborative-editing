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

// Autoload or require the classes.
require_once __DIR__ . '/src/Engine.php';
require_once __DIR__ . '/src/Sync.php';

// Initialize the plugin engine and sync handler.
add_action( 'plugins_loaded', function() {
    new \DotOrg\GCE\Engine();
    new \DotOrg\GCE\Sync();
} );

register_activation_hook( __FILE__, function() {
	if ( ! wp_next_scheduled( 'gce_cleanup_transients_cron' ) ) {
		wp_schedule_event( time(), 'daily', 'gce_cleanup_transients_cron' );
	}
} );
register_deactivation_hook( __FILE__, function() {
    $timestamp = wp_next_scheduled( 'gce_cleanup_transients_cron' );
    if ( $timestamp ) {
        wp_unschedule_event( $timestamp, 'gce_cleanup_transients_cron' );
    }
} );
