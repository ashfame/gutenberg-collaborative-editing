import { Tooltip } from '@wordpress/components';

const UserAvatar = ( { user, ringColor } ) => {
	if ( ! user || ! user.name ) {
		return null;
	}

	return (
		<Tooltip text={ user.name }>
			<li className="gce-user-avatar">
				<img
					src={ user.avatar }
					alt={ user.name }
					className="avatar"
					style={ { borderColor: ringColor } }
				/>
			</li>
		</Tooltip>
	);
};

export default UserAvatar;
