import React from 'react';
import { createPortal } from 'react-dom';
import { useSelect } from '@wordpress/data';
import { useMultiCursor } from '../useMultiCursor';
import AvatarList from './AvatarList';

/**
 * A container for presence-related UI components.
 *
 * @param {object} props The props for the component.
 * @param {import('../hooks/types').CollaborativeState['awareness']} props.awarenessState The awareness state.
 * @param {(awareness: any) => void} props.syncAwareness A function to sync the awareness state.
 * @returns {React.ReactElement} The rendered component.
 */
export const PresenceUI = ( { awarenessState, syncAwareness } ) => {
	const { currentUserId } = useSelect( ( select ) => ( {
		currentUserId: select( 'core' )?.getCurrentUser()?.id,
	} ), [] );

	// Modify awareness state to exclude current user
	delete awarenessState[currentUserId];

	useMultiCursor( currentUserId, awarenessState, syncAwareness );

	if ( ! awarenessState || Object.keys( awarenessState ).length === 0 ) {
		return null;
	}

	const headerTarget = document.querySelector( '.editor-header__center' );
	return (
		<>
			{ headerTarget &&
				createPortal( <AvatarList users={ awarenessState } />, headerTarget ) }
		</>
	);
};
