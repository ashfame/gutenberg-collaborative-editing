import { Modal, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';

export const PostNotLocked = () => {
	const [userLockData, setUserLockData] = useState({
		currentUserId: null,
		lockAcquireeUserId: null
	});
	const [currentUserHasLock, setCurrentUserHasLock] = useState(false);
	const [showROModal, setShowROModal] = useState(false);

	// Use useSelect to subscribe to editor and core data stores
	const {
		currentUserId,
		lockAcquireeUserId 
	} = useSelect((select) => {
		const editorSelect = select('core/editor');
		const coreSelect = select('core');

		const activePostLock = editorSelect?.getActivePostLock?.();
		const currentUser = coreSelect?.getCurrentUser?.();

		return {
			currentUserId: currentUser?.id || null,
			lockAcquireeUserId: activePostLock ? parseInt(activePostLock.split(':').pop()) : null
		};
	}, []);

	// Update userLockData when we have the data
	useEffect(() => {
		if (currentUserId === null) {
			return;
		}

		setUserLockData({
			currentUserId,
			lockAcquireeUserId
		});
	}, [currentUserId, lockAcquireeUserId]);

	// Handle lock state changes when we have userLockData
	useEffect(() => {
		if (userLockData.currentUserId === null) return; // wait until we have data
		
		const { currentUserId, lockAcquireeUserId } = userLockData;
		const hasLock = lockAcquireeUserId != null && currentUserId === lockAcquireeUserId;
		setCurrentUserHasLock(hasLock);
		setShowROModal(!hasLock);
	}, [userLockData]);

	// debug
	useEffect(() => {
		const { currentUserId, lockAcquireeUserId } = userLockData;
		console.log('currentUserId:', currentUserId, 'lockAcquireeUserId:', lockAcquireeUserId, 'currentUserHasLock:', currentUserHasLock, 'showROModal:', showROModal);
	}, [userLockData, currentUserHasLock, showROModal]);

	// Create notice when user doesn't have the lock
	useEffect(() => {
		if (userLockData.currentUserId === null) return; // wait until we have data

		if (currentUserHasLock) {
			wp.data.dispatch('core/notices').removeNotice('read-only-mode');
			return;
		}
		wp.data.dispatch('core/notices').createNotice(
			'info',
			'Read-only mode',
			{
				isDismissible: false,
				id: 'read-only-mode'
			}
		);
	}, [currentUserHasLock, userLockData.currentUserId]);

	if (userLockData.currentUserId !== null && showROModal) {
		return (
			<Modal
				className="gutenberg-collaborative-editing-post-locked-modal"
				title={__('READ_ONLY', 'gutenberg-collaborative-editing')}
				onRequestClose={() => setShowROModal(false)}
			>
				<p>
					Someone else is editing this post right now. So, for now, you only have read-only access to this post.
				</p>
				<Button variant="primary" onClick={() => setShowROModal(false)}>
					Okay
				</Button>
			</Modal>
		);
	}
};
