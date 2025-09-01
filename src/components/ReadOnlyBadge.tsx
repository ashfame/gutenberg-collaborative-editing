import { useEffect, createRoot } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/components';

export const ReadOnlyBadge = () => {
	useEffect( () => {
		const targetElement = document.querySelector(
			'.editor-header__settings'
		);

		if ( ! targetElement ) {
			return;
		}

		// Don't add if it already exists. This can happen with fast re-renders.
		if (
			targetElement.querySelector(
				'.gutenberg-collaborative-editing-readonly-badge'
			)
		) {
			return;
		}

		const badge = document.createElement( 'div' );
		badge.className = 'gutenberg-collaborative-editing-readonly-badge';
		targetElement.insertBefore( badge, targetElement.lastChild );

		const root = createRoot( badge );
		const badgeContent = (
			<>
				<Icon size={ 18 } icon="lock" />
				<span style={ { marginLeft: '4px' } }>
					{ __( 'Read-only', 'gutenberg-collaborative-editing' ) }
				</span>
			</>
		);

		root.render( badgeContent );

		return () => {
			root.unmount();
			if ( badge && badge.parentNode === targetElement ) {
				targetElement.removeChild( badge );
			}
		};
	}, [] );

	return null;
};
