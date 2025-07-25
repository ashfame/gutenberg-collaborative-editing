import UserAvatar from './UserAvatar';

const AvatarList = ( { users } ) => {
	const MAX_VISIBLE_AVATARS = 5;
	const visibleUsers = users.slice( 0, MAX_VISIBLE_AVATARS );
	const hiddenUsersCount = users.length - visibleUsers.length;

	// TODO: Filter current user out of display
	// const otherUsers = Object.values( awarenessData ).filter(
	// 	( awarenessState ) =>
	// 		awarenessState.user?.id &&
	// 		awarenessState.user?.id !== currentUserId
	// );
	//
	// if ( otherUsers.length === 0 ) {
	// 	return null;
	// }

	return (
		<ul className="gce-avatar-list">
			{ visibleUsers.map( ( awarenessState, index ) => {
				return <UserAvatar key={ index } user={ awarenessState.user } />;
			} ) }
			{ hiddenUsersCount > 0 && (
				<div className="gce-avatar-list__more">
					+{ hiddenUsersCount }
				</div>
			) }
		</ul>
	);
};

export default AvatarList;
