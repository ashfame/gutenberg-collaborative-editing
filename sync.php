<?php
/**
 * Sync endpoint for Gutenberg collaborative editing
 * Handles both content storage and long polling for real-time sync
 */

// Security check
if (!defined('ABSPATH')) {
    // Try to load WordPress
    $wp_load_paths = [
        dirname(__FILE__) . '/wp-load.php',
        dirname(__FILE__) . '/../wp-load.php',
        dirname(__FILE__) . '/../../wp-load.php',
        dirname(__FILE__) . '/../../../wp-load.php'
    ];
    
    $wp_loaded = false;
    foreach ($wp_load_paths as $wp_load_path) {
        if (file_exists($wp_load_path)) {
            require_once $wp_load_path;
            $wp_loaded = true;
            break;
        }
    }
    
    if (!$wp_loaded) {
        http_response_code(500);
        die('WordPress not found');
    }
}

// Headers for CORS and content type
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-WP-Nonce');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get request method and handle accordingly
$request_method = $_SERVER['REQUEST_METHOD'];

if ($request_method === 'POST') {
    handle_content_update();
} elseif ($request_method === 'GET') {
    handle_content_poll();
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

/**
 * Handle content update from lock holder
 */
function handle_content_update() {
    // Verify nonce
    $nonce = $_SERVER['HTTP_X_WP_NONCE'] ?? '';
    if (!wp_verify_nonce($nonce, 'gutenberg_sync_nonce')) {
        http_response_code(403);
        echo json_encode(['error' => 'Invalid nonce']);
        return;
    }
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['post_id']) || !isset($input['content'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid request data']);
        return;
    }
    
    $post_id = intval($input['post_id']);
    $content = $input['content'];
    $timestamp = time();
    
    // Verify user has lock on this post
    if (!user_has_post_lock($post_id)) {
        http_response_code(403);
        echo json_encode(['error' => 'User does not have lock on this post']);
        return;
    }
    
    // Store content in transient (expires in 1 hour)
    $transient_key = "gce_sync_content_{$post_id}";
    $sync_data = [
        'content' => $content,
        'timestamp' => $timestamp,
        'post_id' => $post_id,
        'user_id' => get_current_user_id()
    ];
    
    set_transient($transient_key, $sync_data, HOUR_IN_SECONDS);
    
    // Also store in a "latest updates" transient for polling
    $updates_key = "gce_sync_updates_{$post_id}";
    $existing_updates = get_transient($updates_key) ?: [];
    $existing_updates[] = $sync_data;
    
    // Keep only last 10 updates
    $existing_updates = array_slice($existing_updates, -10);
    set_transient($updates_key, $existing_updates, HOUR_IN_SECONDS);
    
    echo json_encode([
        'success' => true,
        'timestamp' => $timestamp,
        'message' => 'Content updated successfully'
    ]);
}

/**
 * Handle content polling from non-lock holders
 */
function handle_content_poll() {
    // Verify nonce
    $nonce = $_SERVER['HTTP_X_WP_NONCE'] ?? '';
    if (!wp_verify_nonce($nonce, 'gutenberg_sync_nonce')) {
        http_response_code(403);
        echo json_encode(['error' => 'Invalid nonce']);
        return;
    }
    
    $post_id = intval($_GET['post_id'] ?? 0);
    $last_timestamp = intval($_GET['last_timestamp'] ?? 0);
    
    if (!$post_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing post_id']);
        return;
    }
    
    // Long polling implementation
    $max_wait = 30; // 30 seconds max wait
    $check_interval = 1; // Check every 1 second
    $start_time = time();
    
    while ((time() - $start_time) < $max_wait) {
        $transient_key = "gce_sync_content_{$post_id}";
        $sync_data = get_transient($transient_key);
        
        if ($sync_data && $sync_data['timestamp'] > $last_timestamp) {
            echo json_encode([
                'success' => true,
                'content' => $sync_data,
                'has_update' => true
            ]);
            return;
        }
        
        // Sleep for check interval
        sleep($check_interval);
    }
    
    // No update found within timeout
    echo json_encode([
        'success' => true,
        'content' => null,
        'has_update' => false
    ]);
}

/**
 * Check if current user has lock on post
 */
function user_has_post_lock($post_id) {
    if (!function_exists('wp_check_post_lock')) {
        require_once ABSPATH . 'wp-admin/includes/post.php';
    }
    
    $lock = wp_check_post_lock($post_id);
    return !$lock; // If no lock exists, current user has it
}
