import UserAvatar from './UserAvatar';
import { UserAwareness } from '@/hooks/types';

interface AvatarListProps {
	users: {
		[ userId: number ]: UserAwareness;
	};
}

const AvatarList = ( { users }: AvatarListProps ) => {
	const MAX_VISIBLE_AVATARS = 5;

	// Filter out excessive users beyond the defined limit in MAX_VISIBLE_AVATARS
	const visibleUsers = Object.fromEntries(
		Object.entries( users ).slice( 0, MAX_VISIBLE_AVATARS )
	);
	const hiddenUsersCount =
		Object.keys( users ).length - Object.keys( visibleUsers ).length;

	return (
		<ul className="gce-avatar-list">
			{ Object.values( visibleUsers ).map( ( visibleUser, index ) => {
				return (
					<UserAvatar
						key={ index }
						user={ visibleUser.user_data }
						ringColor={ visibleUser.color }
					/>
				);
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
