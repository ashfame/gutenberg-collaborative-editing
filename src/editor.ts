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
			// The block element is the first child of our wrapper
			const element = wrapper?.firstElementChild as HTMLElement;

			if ( ! element ) {
				return;
			}

			if ( isLocked && ! isLockedRef.current ) {
				lockEditor( element );
				isLockedRef.current = true;
			} else if ( ! isLocked && isLockedRef.current ) {
				releaseEditor( element );
				isLockedRef.current = false;
			}
		}, [ isLocked ] );

		const el = createElement( BlockListBlock, {
			...props,
			className,
		} );

		// We wrap the block in a div to reliably get its DOM element via a ref.
		// `display: contents` ensures this wrapper doesn't affect the layout.
		return createElement(
			'div',
			{ ref: wrapperRef, style: { display: 'contents' } },
			el
		);
	};
}, 'withLockedClass' );

addFilter( 'editor.BlockListBlock', 'gce/with-locked-class', withLockedClass );
