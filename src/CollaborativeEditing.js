import { Modal, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCollaborativeEditingData } from './hooks/useCollaborativeEditingData';
import { useContentSync } from './hooks/useContentSync';
import { useAwarenessAndPolling } from './hooks/useAwarenessAndPolling';
import { useReadOnlyUI } from './hooks/useReadOnlyUI';

export const CollaborativeEditing = () => {
	const { currentUserId, isUserLockHolder, postId, currentContent } =
		useCollaborativeEditingData();

	useContentSync(postId, currentContent, isUserLockHolder);
	useAwarenessAndPolling(postId, currentUserId, isUserLockHolder);
	const { showModal, setShowModal } = useReadOnlyUI(
		isUserLockHolder,
		currentUserId
	);

	// Don't render anything if user data not loaded or user has lock
	if (currentUserId === null || isUserLockHolder) {
		return null;
	}

	if (!showModal) {
		return null;
	}

	return (
		<Modal
			className="gutenberg-collaborative-editing-read-only-modal"
			title={__('Read-Only Mode', 'gutenberg-collaborative-editing')}
			onRequestClose={() => setShowModal(false)}
		>
			<p>
				{ __(
					'Someone else is currently editing this post. You can only view the post content.',
					'gutenberg-collaborative-editing'
				) }
			</p>
			<Button variant="primary" onClick={() => setShowModal(false)}>
				Okay
			</Button>
		</Modal>
	)
};
