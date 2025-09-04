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

		const wrapperRef = useRef< HTMLElement >( null );
		const isLockedRef = useRef( false );

		let className = props.className || '';
		const isLocked = lockedBlocks.includes( clientId );
		if ( isLocked ) {
			className = `${ className } gce-locked`;
		}

		useEffect( () => {
			const wrapper = wrapperRef.current;
			if ( ! wrapper ) {
				return;
			}

			// Find the actual block element within our wrapper
			// The BlockListBlock renders a div with data-block attribute
			const findBlockElement = ( container: HTMLElement ) => {
				// Fall back to the block wrapper itself
				const blockElement = container.querySelector(
					'.wp-block'
				) as HTMLElement;
				if ( blockElement ) {
					return blockElement;
				}

				// Last resort: return the container itself
				return container;
			};

			const element = findBlockElement( wrapper );

			if ( isLocked && ! isLockedRef.current ) {
				// Block became locked - add event listeners
				lockEditor( element );
				isLockedRef.current = true;
			} else if ( ! isLocked && isLockedRef.current ) {
				// Block became unlocked - remove event listeners
				releaseEditor( element );
				isLockedRef.current = false;
			}
		}, [ isLocked ] );

		const el = createElement( BlockListBlock, {
			...props,
			className,
		} );

		// Wrap in a div to get access to the DOM element without direct DOM queries
		return createElement(
			'div',
			{ ref: wrapperRef, style: { display: 'contents' } },
			el
		);
	};
}, 'withLockedClass' );

addFilter( 'editor.BlockListBlock', 'gce/with-locked-class', withLockedClass );
