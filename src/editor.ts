import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
import { createElement, useRef, useEffect } from '@wordpress/element';
import { lockEditor, releaseEditor } from '@/utils';

const withLockedClass = createHigherOrderComponent( ( BlockListBlock ) => {
	return ( props ) => {
		const { clientId } = props;
		const { lockedBlocks } = useSelect(
			( select: any ) => ( {
				lockedBlocks: select( 'gce' ).getLockedBlocks(),
			} ),
			[]
		);

		const blockRef = useRef< HTMLElement >( null );
		const isLockedRef = useRef( false );

		let className = props.className || '';
		const isLocked = lockedBlocks.includes( clientId );
		if ( isLocked ) {
			className = `${ className } gce-locked`;
		}

		useEffect( () => {
			const element = blockRef.current;
			if ( ! element ) {
				return;
			}

			if ( isLocked && ! isLockedRef.current ) {
				// Block became locked - add event listeners
				lockEditor( element );
				isLockedRef.current = true;
			} else if ( ! isLocked && isLockedRef.current ) {
				// Block became unlocked - remove event listeners (if you implement releaseEditor)
				releaseEditor( element );
				isLockedRef.current = false;
			}
		}, [ isLocked ] );

		const el = createElement( BlockListBlock, { ...props, className } );

		// Wrap in a div with ref to get DOM access for lockEditor
		return createElement( 'div', { ref: blockRef }, el );
	};
}, 'withLockedClass' );

addFilter( 'editor.BlockListBlock', 'gce/with-locked-class', withLockedClass );
