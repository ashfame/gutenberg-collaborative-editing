import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
import { createElement } from '@wordpress/element';

const withLockedClass = createHigherOrderComponent( ( BlockListBlock ) => {
	return ( props ) => {
		const { clientId } = props;
		const { lockedBlocks } = useSelect(
			( select ) => ( {
				lockedBlocks: select( 'gce' ).getLockedBlocks(),
			} ),
			[]
		);

		let className = props.className || '';
		if ( lockedBlocks.includes( clientId ) ) {
			className = `${ className } gce-locked`;
		}

		return createElement( BlockListBlock, { ...props, className } );
	};
}, 'withLockedClass' );

addFilter( 'editor.BlockListBlock', 'gce/with-locked-class', withLockedClass );
