import { registerPlugin } from '@wordpress/plugins';
import { PostNotLocked } from './PostNotLocked';
import './style.scss';
import domReady from '@wordpress/dom-ready';

domReady( () => {
	registerPlugin( 'gutenberg-collaborative-editing', {
		render: PostNotLocked,
		icon: null,
	} );
} );

// Heartbeat for user presence.
if ( window.gce && window.gce.postId ) {
	jQuery( document ).on( 'heartbeat-send', function ( event, data ) {
		data.gce_post_id = window.gce.postId;
	} );
}
