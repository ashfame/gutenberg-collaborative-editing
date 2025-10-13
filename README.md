# Gutenberg Collaborative Editing

- Contributors: wordpressdotorg, ashfame
- Tags: gutenberg, collaborative-editing
- Requires at least: 6.0
- Tested up to: 6.8.2
- Requires PHP: 7.4
- License: [GPLv2](http://www.gnu.org/licenses/gpl-2.0.html)
- Stable tag: 0.1.0
- GitHub Plugin URI: https://github.com/ashfame/gutenberg-collaborative-editing

Enable collaborative editing in Gutenberg

## Description
Enable collaborative editing in Gutenberg.

## Settings
This plugin adds a settings page under `Settings > Collaborative Editing` in the WordPress admin.

- **Collaboration Mode**:
    - **Read-only Follow**: The first user to open a post gets editing rights, and subsequent users can only view the post in real-time.
    - **Block-level Locks**: Multiple users can edit the same post, just not the same block. (🚧Functional, but still a Work in Progress)

## Screenshots
![Example](.wporg/screenshot-1.png)

## How to run this locally?
- After cloning the GIT repo locally, run `nvm use`, `npm install`.
- Run `npm run build` once or can also run `npm run start`.
- Run `npm run wp-env start` (you will need docker running).
- Login into WordPress ([http://localhost:8888/wp-admin](http://localhost:8888/wp-admin)) with username `admin` and password as `password`.
- Configure the collaboration mode on `Settings > Collaborative Editing`.
- Create two or more users and log in from these user accounts in separate browser instances.
- Edit the same post or page for editing.
- Being on a call, these users can meaningfully participate already as of today.

## How to get the plugin zip file?
- Run `nvm use`, `npm run package` to generate the zip file in the `dist` directory.

## Frequently Asked Questions

### How do I use it?
Install this plugin, configure the collaboration mode and have more than one user edit the same post or page.

### Can I programmatically control what post or page I have this enabled on?
Not yet. I need to figure out a good way to enable that. But eventually I would like it to be configurable as follows:

~~~php
// functions.php
add_filter( 'gutenberg_collabrative_editing_enabled', function ( $post, $user_ids_collaborating, $user_id_initiating_collaboration ) {
    // Add logic here
	return $true;
} );
~~~

## Changelog

### 0.1.0

- Offers a functional collaborative editing experience, with certain edge cases

### 0.0.1

- Initial dev release
