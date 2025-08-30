import React from '@wordpress/element';
import type { CSSProperties } from 'react';
import { Tooltip } from '@wordpress/components';
import { User } from '../hooks/types';

interface UserAvatarProps {
	user: User;
	ringColor: string;
}

const UserAvatar = ( { user, ringColor }: UserAvatarProps ) => {
	if ( ! user || ! user.name ) {
		return null;
	}

	return (
		<Tooltip text={ user.name } delay={ 100 }>
			<li
				className="gce-user-avatar"
				style={
					{ '--gce-ring-color': ringColor } as CSSProperties
				}
			>
				<img src={ user.avatar } alt={ user.name } className="avatar" />
			</li>
		</Tooltip>
	);
};

export default UserAvatar;
