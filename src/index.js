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
