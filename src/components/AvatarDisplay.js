import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import AvatarList from './AvatarList';

const AvatarDisplay = ( { awarenessData } ) => {
	const { currentUserId } = useSelect( ( select ) => {
		const { getCurrentUser } = select( 'core' );
		return {
			currentUserId: getCurrentUser()?.id,
		};
	}, [] );

	if ( ! awarenessData || ! currentUserId ) {
		return null;
	}

	// Filter out the current user so they don't see their own avatar.
	const otherUsers = Object.values( awarenessData ).filter(
		( awarenessState ) =>
			awarenessState.user?.id &&
			awarenessState.user?.id !== currentUserId
	);

	if ( otherUsers.length === 0 ) {
		return null;
	}

	return (
		<div className="avatar-display">
			<h4>{ __( 'Currently editing', 'gutenberg' ) }</h4>
			<AvatarList users={ otherUsers } />
		</div>
	);
};

export default AvatarDisplay; 