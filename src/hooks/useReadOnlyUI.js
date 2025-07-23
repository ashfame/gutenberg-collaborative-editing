import { useState, useEffect } from '@wordpress/element';
import { preventEditing, disableAutoSave } from '../utils';

export const useReadOnlyUI = (isUserLockHolder, currentUserId) => {
	const [showModal, setShowModal] = useState(false);

	useEffect(() => {
		if (currentUserId === null) return;

		const editorElement = document.querySelector('.editor-visual-editor');

		if (isUserLockHolder) {
			setShowModal(false);
			document.body.classList.remove(
				'gutenberg-collaborative-editing-readonly'
			);
		} else {
			setShowModal(true);
			document.body.classList.add(
				'gutenberg-collaborative-editing-readonly'
			);
			disableAutoSave();

			if (editorElement) {
				// Add event listeners to prevent editing
				editorElement.addEventListener('click', preventEditing, true);
				editorElement.addEventListener('mousedown', preventEditing, true);
				editorElement.addEventListener('mouseup', preventEditing, true);
				editorElement.addEventListener('dblclick', preventEditing, true);
				editorElement.addEventListener('keydown', preventEditing, true);
				editorElement.addEventListener('keypress', preventEditing, true);
				editorElement.addEventListener('keyup', preventEditing, true);
				editorElement.addEventListener('input', preventEditing, true);
				editorElement.addEventListener('change', preventEditing, true);
				editorElement.addEventListener('paste', preventEditing, true);
				editorElement.addEventListener('cut', preventEditing, true);
				editorElement.addEventListener('copy', preventEditing, true);
				editorElement.addEventListener('focus', preventEditing, true);
				editorElement.addEventListener('focusin', preventEditing, true);
				editorElement.addEventListener(
					'touchstart',
					preventEditing,
					true
				);
				editorElement.addEventListener('touchend', preventEditing, true);
			}
		}

		return () => {
			document.body.classList.remove(
				'gutenberg-collaborative-editing-readonly'
			);

			if (editorElement) {
				// Remove all event listeners
				editorElement.removeEventListener('click', preventEditing, true);
				editorElement.removeEventListener(
					'mousedown',
					preventEditing,
					true
				);
				editorElement.removeEventListener('mouseup', preventEditing, true);
				editorElement.removeEventListener(
					'dblclick',
					preventEditing,
					true
				);
				editorElement.removeEventListener('keydown', preventEditing, true);
				editorElement.removeEventListener(
					'keypress',
					preventEditing,
					true
				);
				editorElement.removeEventListener('keyup', preventEditing, true);
				editorElement.removeEventListener('input', preventEditing, true);
				editorElement.removeEventListener('change', preventEditing, true);
				editorElement.removeEventListener('paste', preventEditing, true);
				editorElement.removeEventListener('cut', preventEditing, true);
				editorElement.removeEventListener('copy', preventEditing, true);
				editorElement.removeEventListener('focus', preventEditing, true);
				editorElement.removeEventListener('focusin', preventEditing, true);
				editorElement.removeEventListener(
					'touchstart',
					preventEditing,
					true
				);
				editorElement.removeEventListener(
					'touchend',
					preventEditing,
					true
				);
			}
		};
	}, [currentUserId, isUserLockHolder]);

	return { showModal, setShowModal };
}; 