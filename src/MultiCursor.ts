import { CursorState, User } from './hooks/types';

interface UserAwareness {
	cursor: CursorState;
	user: User;
	ring_color: string;
}

export class MultiCursor {
	document: Document;
	overlay: HTMLDivElement;
	currentUserId: number;
	users: Map<string, UserAwareness>;

	constructor(
		doc: Document,
		overlayElement: HTMLDivElement,
		currentUserId: number
	) {
		this.document = doc;
		this.overlay = overlayElement;
		this.currentUserId = currentUserId;
		this.users = new Map();
	}

	findTextPosition(
		root: Node,
		offset: number
	): { node: Node; offset: number } {
		const walker = this.document.createTreeWalker(
			root,
			NodeFilter.SHOW_TEXT
		);
		let currentOffset = 0;
		let node;
		let lastTextNode = null;

		while ((node = walker.nextNode())) {
			const len = node.nodeValue.length;
			if (currentOffset + len >= offset) {
				return { node, offset: offset - currentOffset };
			}
			currentOffset += len;
			lastTextNode = node;
		}

		if (lastTextNode) {
			return { node: lastTextNode, offset: lastTextNode.nodeValue.length };
		}

		return { node: root, offset: 0 };
	}

	/**
	 * Updates user's awareness data
	 */
	updateUser( userId: string, awarenessData: any ) {
		// Additional check of filtering out the current user
		if ( parseInt( userId, 10 ) === this.currentUserId ) {
			return;
		}
		try {
			this.users.set(
				userId,
				{
					cursor: awarenessData.cursor_state,
					user: awarenessData.user_data,
					ring_color: awarenessData.color
				}
			);
		} catch (e) {
			console.error('Failed to parse cursor state for user', userId, awarenessData, e);
		}
	}

	removeUser( userId: string ) {
		this.users.delete( userId );
	}

	getPos(
		blockEl: HTMLElement,
		charOffset: number
	): { x: number; y: number; height: number } | null {
		const pos = this.findTextPosition( blockEl, charOffset );

		if ( ! pos.node ) {
			return null;
		}

		const range = this.document.createRange();
		try {
			range.setStart(pos.node, pos.offset);
		} catch (e) {
			console.error('Failed to set range start', e, pos);
			return null;
		}
		range.collapse(true);

		const rect = range.getBoundingClientRect();
		const overlayRect = this.overlay.getBoundingClientRect();
		const blockRect = blockEl.getBoundingClientRect();

		let x;
		let y;
		if (rect.x === 0 && rect.y === 0 && rect.width === 0 && rect.height === 0) {
			// This can happen for empty blocks.
			x = blockRect.left - overlayRect.left;
			y = blockRect.top - overlayRect.top;
		} else {
			x = rect.left - overlayRect.left;
			y = rect.top - overlayRect.top;
		}

		let height = rect.height;
		if (height === 0) {
			height = parseInt(window.getComputedStyle(blockEl).lineHeight, 10) || blockRect.height;
		}

		return {
			x,
			y,
			height,
		};
	}

	getCoordinatesForCursor(
		blockIndex: number,
		cursorPos: number
	): { startCoords: { x: number; y: number; height: number }; isSelection: false } | null {
		const blocks = window.wp?.data?.select( 'core/block-editor' ).getBlockOrder();
		if ( ! blocks || blockIndex >= blocks.length ) return null;

		const clientId = blocks[blockIndex];
		const blockEl = this.document.querySelector(`[data-block="${clientId}"] .rich-text`) ||
			this.document.querySelector(`[data-block="${clientId}"] .block-editor-rich-text__editable`) ||
			this.document.querySelector(`[data-block="${clientId}"]`);
		if (!blockEl) return null;

		const coords = this.getPos( blockEl, cursorPos );
		return coords ? { startCoords: coords, isSelection: false } : null;
	}

	getCoordinatesForSelection(
		blockIndexStart: number,
		cursorPosStart: number,
		blockIndexEnd: number,
		cursorPosEnd: number
	): { rects: any[]; isSelection: true } | null {
		if (
			blockIndexStart > blockIndexEnd ||
			( blockIndexStart === blockIndexEnd &&
				cursorPosStart > cursorPosEnd )
		) {
			[blockIndexStart, blockIndexEnd] = [blockIndexEnd, blockIndexStart];
			[cursorPosStart, cursorPosEnd] = [cursorPosEnd, cursorPosStart];
		}

		const blocks = window.wp?.data?.select( 'core/block-editor' ).getBlockOrder();
		if ( ! blocks || blockIndexStart >= blocks.length || blockIndexEnd >= blocks.length ) return null;

		const startClientId = blocks[blockIndexStart];
		const endClientId = blocks[blockIndexEnd];

		const getBlockEl = (clientId) =>
			this.document.querySelector(`[data-block="${clientId}"] .rich-text`) ||
			this.document.querySelector(`[data-block="${clientId}"] .block-editor-rich-text__editable`) ||
			this.document.querySelector(`[data-block="${clientId}"]`);

		const startBlockEl = getBlockEl(startClientId);
		const endBlockEl = getBlockEl(endClientId);

		if ( ! startBlockEl || ! endBlockEl ) {
			return null;
		}

		const overlayRect = this.overlay.getBoundingClientRect();
		const rects = [];

		const addRects = (range) => {
			const clientRects = range.getClientRects();
			for (const rect of clientRects) {
				rects.push({
					x: rect.left - overlayRect.left,
					y: rect.top - overlayRect.top,
					width: rect.width,
					height: rect.height,
				});
			}
		};

		if (blockIndexStart === blockIndexEnd) {
			const range = this.document.createRange();
			const startPos = this.findTextPosition(startBlockEl, cursorPosStart);
			const endPos = this.findTextPosition(endBlockEl, cursorPosEnd);
			if (startPos.node && endPos.node) {
				try {
					range.setStart(startPos.node, startPos.offset);
					range.setEnd(endPos.node, endPos.offset);
					addRects(range);
				} catch (e) {
					console.error('Failed to create range', e, startPos, endPos);
				}
			}
		} else {
			// Multi-block selection
			// 1. Rects for the start block
			const startRange = this.document.createRange();
			const startPos = this.findTextPosition(startBlockEl, cursorPosStart);
			const endOfStartBlock = this.findTextPosition(startBlockEl, startBlockEl.textContent.length);
			startRange.setStart(startPos.node, startPos.offset);
			startRange.setEnd(endOfStartBlock.node, endOfStartBlock.offset);
			addRects(startRange);

			// 2. Rects for intermediate blocks
			for (let i = blockIndexStart + 1; i < blockIndexEnd; i++) {
				const intermediateBlockEl = getBlockEl(blocks[i]);
				if (intermediateBlockEl) {
					const intermediateRange = this.document.createRange();
					intermediateRange.selectNodeContents(intermediateBlockEl);
					addRects(intermediateRange);
				}
			}

			// 3. Rects for the end block
			const endRange = this.document.createRange();
			const startOfEndBlock = this.findTextPosition(endBlockEl, 0);
			const endPos = this.findTextPosition(endBlockEl, cursorPosEnd);
			endRange.setStart(startOfEndBlock.node, startOfEndBlock.offset);
			endRange.setEnd(endPos.node, endPos.offset);
			addRects(endRange);
		}

		const result = rects.length > 0 ? { rects, isSelection: true } : null;
		return result;
	}

	getCoordinatesFromCursorState(
		cursorState: CursorState
	): { rects: any[]; isSelection: true } | { startCoords: { x: number; y: number; height: number }; isSelection: false } | null {
		// This handles both single-block and multi-block selections.
		if ( 'cursorPosStart' in cursorState ) {
			const startBlock =
				'blockIndexStart' in cursorState
					? cursorState.blockIndexStart
					: cursorState.blockIndex;
			const endBlock =
				'blockIndexEnd' in cursorState
					? cursorState.blockIndexEnd
					: cursorState.blockIndex;
			return this.getCoordinatesForSelection(
				startBlock,
				cursorState.cursorPosStart,
				endBlock,
				cursorState.cursorPosEnd
			);
		}

		// This handles a simple cursor (no selection).
		if ( 'cursorPos' in cursorState ) {
			return this.getCoordinatesForCursor(
				cursorState.blockIndex,
				cursorState.cursorPos
			);
		}

		return null;
	}

	renderCursors( awarenessData: any ) {
		if ( ! awarenessData ) {
			return;
		}
		
		// Update state with supplied awareness data
		Object.keys(awarenessData).forEach(userId => {
			if (awarenessData[userId]?.cursor_state) {
				this.updateUser(userId, awarenessData[userId]);
			} else {
				this.removeUser(userId);
			}
		});

		// Clean up overlay
		this.overlay.innerHTML = '';

		// Render each user's cursor
		this.users.forEach((userAwareness, userId) => {
			const result = this.getCoordinatesFromCursorState(userAwareness.cursor);
			if (!result) {
				return;
			}

			const color = userAwareness.ring_color;

			if (result.isSelection) {
				// Render selection
				const { rects } = result;
				rects.forEach(rect => {
					const selection = this.document.createElement('div');
					selection.className = 'remote-selection';
					selection.style.left = `${rect.x}px`;
					selection.style.top = `${rect.y}px`;
					selection.style.width = `${rect.width}px`;
					selection.style.height = `${rect.height}px`;
					selection.style.backgroundColor = color;
					this.overlay.appendChild(selection);
				});

				const cursor = this.document.createElement('div');
				cursor.className = 'remote-cursor';
				const lastRect = rects[rects.length - 1];
				cursor.style.left = `${lastRect.x + lastRect.width}px`;
				cursor.style.top = `${lastRect.y}px`;
				cursor.style.backgroundColor = color;
				if (lastRect.height) {
					cursor.style.height = `${lastRect.height}px`;
				}
				const label = this.document.createElement('div');
				label.className = 'cursor-label';
				label.textContent = userAwareness.user?.name || `User ${userId}`;
				label.style.backgroundColor = color;

				cursor.appendChild(label);
				this.overlay.appendChild(cursor);
			} else {
				// Create cursor element
				const cursor = this.document.createElement('div');
				cursor.className = 'remote-cursor';
				cursor.style.left = `${result.startCoords.x}px`;
				cursor.style.top = `${result.startCoords.y}px`;
				cursor.style.backgroundColor = color;
				if (result.startCoords.height) {
					cursor.style.height = `${result.startCoords.height}px`;
				}
				
				// Create label
				const label = this.document.createElement('div');
				label.className = 'cursor-label';
				label.textContent = userAwareness.user?.name || `User ${userId}`;
				label.style.backgroundColor = color;

				cursor.appendChild(label);
				this.overlay.appendChild(cursor);
			}
		});
	}
}
