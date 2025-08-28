import { registerPlugin } from '@wordpress/plugins';
import { CollaborativeEditing } from './CollaborativeEditing';
import './style.scss';
import domReady from '@wordpress/dom-ready';

domReady( () => {
	registerPlugin( 'collaborative-editing', {
		render: CollaborativeEditing,
		icon: null,
	} );
} );

// Heartbeat for user presence.
if ( window.gce && window.gce.postId ) {
	jQuery( document ).on( 'heartbeat-send', function ( event, data ) {
		data.gce_post_id = window.gce.postId;
		data.snapshot_id = window.gce.snapshotId;
	} );
}
