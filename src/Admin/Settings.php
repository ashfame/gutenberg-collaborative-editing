<?php

namespace DotOrg\GCE\Admin;

class Settings {

	public static function init() {
		add_action( 'admin_menu', [ __CLASS__, 'add_options_page' ] );
		add_action( 'admin_init', [ __CLASS__, 'register_settings' ] );
	}

	public static function add_options_page() {
		add_options_page(
			'Collaborative Editing Settings',
			'Collaborative Editing',
			'manage_options',
			'gutenberg-collaborative-editing',
			[ __CLASS__, 'render_page' ]
		);
	}

	public static function register_settings() {
		register_setting(
			'gce_settings_group',
			'gce_collaboration_mode',
			[
				'type'              => 'string',
				'description'       => 'Collaboration Mode',
				'sanitize_callback' => [ __CLASS__, 'sanitize_collaboration_mode' ],
				'default'           => 'READ-ONLY-FOLLOW',
			]
		);

		add_settings_section(
			'gce_settings_section',
			'Collaboration Settings',
			null,
			'gutenberg-collaborative-editing'
		);

		add_settings_field(
			'gce_collaboration_mode',
			'Collaboration Mode',
			[ __CLASS__, 'render_collaboration_mode_field' ],
			'gutenberg-collaborative-editing',
			'gce_settings_section'
		);
	}

	public static function sanitize_collaboration_mode( $input ) {
		$valid_options = [ 'READ-ONLY-FOLLOW', 'BLOCK-LEVEL-LOCKS' ];
		if ( in_array( $input, $valid_options, true ) ) {
			return $input;
		}
		return 'READ-ONLY-FOLLOW';
	}

	public static function render_page() {
		?>
        <div class="wrap">
            <h1><?php
				echo esc_html( get_admin_page_title() ); ?></h1>
            <form action="options.php" method="post">
				<?php
				settings_fields( 'gce_settings_group' );
				do_settings_sections( 'gutenberg-collaborative-editing' );
				submit_button( 'Save Settings' );
				?>
            </form>
        </div>
		<?php
	}

	public static function render_collaboration_mode_field() {
		$option = get_option( 'gce_collaboration_mode', 'READ-ONLY-FOLLOW' );
		?>
        <select name="gce_collaboration_mode" id="gce_collaboration_mode">
            <option value="READ-ONLY-FOLLOW" <?php
			selected( $option, 'READ-ONLY-FOLLOW' ); ?>>
                Read-only Follow
            </option>
            <option value="BLOCK-LEVEL-LOCKS" <?php
			selected( $option, 'BLOCK-LEVEL-LOCKS' ); ?>>
                Block-level Locks
            </option>
        </select>
        <p class="description">
            Choose the collaboration mode.
        </p>
		<?php
	}

	public static function get() {
		return [
			'collaboration_mode' => get_option( 'gce_collaboration_mode', 'READ-ONLY-FOLLOW' )
		];
	}
}
