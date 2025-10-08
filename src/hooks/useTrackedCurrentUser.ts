import { useState, useRef, useEffect, useMemo } from '@wordpress/element';
import { CursorState } from './types';

const getBlockIndex = ( state: CursorState | null ): number | undefined => {
	if ( ! state ) {
		return undefined;
	}

	// For locks, we only care for blockIndex and not blockIndexStart
	return 'blockIndex' in state ? state.blockIndex : undefined;
};

export const useTrackedCurrentUser = ( currentUser: CursorState | null ) => {
	const [ blockTs, setBlockTs ] = useState< number >( 0 );
	const prevBlockIndexRef = useRef< number | undefined >();

	useEffect( () => {
		const currentBlockIndex = getBlockIndex( currentUser );

		if ( prevBlockIndexRef.current !== currentBlockIndex ) {
			setBlockTs( Date.now() );
		}
		prevBlockIndexRef.current = currentBlockIndex;
	}, [ currentUser ] );

	return useMemo( () => {
		if ( ! currentUser ) {
			return null;
		}
		return { ...currentUser, blockTs };
	}, [ currentUser, blockTs ] );
};
