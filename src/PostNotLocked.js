import { Modal, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';

export const PostNotLocked = () => {
	const [showModal, setShowModal] = useState(false);

	const { createNotice, removeNotice } = useDispatch('core/notices');

	// Get all required data in a single useSelect
	const { currentUserId, isUserLockHolder } = useSelect((select) => {
		const editorSelect = select('core/editor');
		const coreSelect = select('core');

		const activePostLock = editorSelect?.getActivePostLock?.();
		const currentUser = coreSelect?.getCurrentUser?.();
		const currentUserId = currentUser?.id || null;
		const lockAcquireeUserId = activePostLock ? parseInt(activePostLock.split(':').pop()) : null;
		
		const isUserLockHolder = lockAcquireeUserId != null && currentUserId === lockAcquireeUserId;

		return {
			currentUserId,
			isUserLockHolder
		};
	}, []);

	// Handle read-only mode when we have user data
	useEffect(() => {
		if (currentUserId === null) return;

		if (isUserLockHolder) {
			// User has the lock - remove notice and hide modal
			removeNotice('read-only-mode');
			setShowModal(false);
		} else {
			// User doesn't have the lock - show notice and modal
			createNotice('info', 'Read-only mode', {
				isDismissible: false,
				id: 'read-only-mode'
			});
			setShowModal(true);
		}
	}, [currentUserId, isUserLockHolder, createNotice, removeNotice]);

	// Cleanup
	useEffect(() => {
		return () => {
			removeNotice('read-only-mode');
		};
	}, [removeNotice]);

	// Only render modal if user data is loaded and user doesn't have lock
	if (currentUserId === null || isUserLockHolder) {
		return null;
	}

	return showModal ? (
		<Modal
			className="gutenberg-collaborative-editing-read-only-modal"
			title={__('READ_ONLY', 'gutenberg-collaborative-editing')}
			onRequestClose={() => setShowModal(false)}
		>
			<p>
				Someone else is editing this post right now. So, for now, you only have read-only access to this post.
			</p>
			<Button variant="primary" onClick={() => setShowModal(false)}>
				Okay
			</Button>
		</Modal>
	) : null;
};
