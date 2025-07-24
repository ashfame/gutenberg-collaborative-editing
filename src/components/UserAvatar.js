import { __ } from '@wordpress/i18n';
import { Popover } from '@wordpress/components';

const UserAvatar = ( { user } ) => {
	if ( ! user || ! user.name || ! user.avatar_url ) {
		return null;
	}

	const { name, avatar_url: avatarUrl } = user;

	return (
		<li className="gce-user-avatar">
			<img
				src={ avatarUrl }
				alt={ name }
				className="avatar"
				title={ name }
			/>
		</li>
	);
};

export default UserAvatar; 