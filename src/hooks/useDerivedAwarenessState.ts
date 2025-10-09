import { useMemo, useRef } from '@wordpress/element';
import { AwarenessState, DataManagerState } from './types';
import { isEqual } from 'lodash';

export const useDerivedAwarenessState = (
	awareness: AwarenessState,
	currentUserId: number,
	recalcTrigger: number // used to force recalculation of derived state
) => {
	const derivedStateRef = useRef< Partial< DataManagerState > >( {} );
	return useMemo( () => {
		const activeUsers = Object.keys( awareness ).reduce< AwarenessState >(
			( acc, key ) => {
				const userId = Number( key );
				const userData = awareness[ userId ];
				const heartbeatAge = Date.now() - userData.heartbeat_ts;
				if ( heartbeatAge < window.gce.awarenessTimeout ) {
					acc[ userId ] = userData;
				}
				return acc;
			},
			{}
		);

		const otherUsers: AwarenessState = { ...awareness };
		delete otherUsers[ currentUserId ];

		const otherActiveUsers: AwarenessState = { ...activeUsers };
		delete otherActiveUsers[ currentUserId ];

		const newDerivedState = {
			awareness,
			activeUsers,
			otherUsers,
			otherActiveUsers,
		};
		if ( isEqual( derivedStateRef.current, newDerivedState ) ) {
			return derivedStateRef.current;
		}
		derivedStateRef.current = newDerivedState;
		return newDerivedState;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ awareness, currentUserId, recalcTrigger ] );
};
