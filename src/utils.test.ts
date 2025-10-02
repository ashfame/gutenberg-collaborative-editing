import { mergeBlocks } from './utils';

// Helper to create a mock block
const createBlock = ( id: string, content: string ) => ( {
	clientId: id,
	name: 'core/paragraph',
	isValid: true,
	attributes: { content },
	innerBlocks: [],
	originalContent: `<p>${ content }</p>`,
} );

describe( 'mergeBlocks', () => {
	const blockA = createBlock( 'a', 'Block A' );
	const blockB = createBlock( 'b', 'Block B' );
	const blockC = createBlock( 'c', 'Block C' );
	const blockD = createBlock( 'd', 'Block D' );
	const engagedBlockB = createBlock( 'b', 'Engaged Block B' );

	describe( 'when a block is moved', () => {
		const receivedBlocks = [ blockA, blockC, blockB ]; // B and C swapped

		it( 'should work when no block is engaged', () => {
			const existingBlocks = [ blockA, blockB, blockC ];
			const result = mergeBlocks( existingBlocks, receivedBlocks, -1 );
			expect( result.map( ( b ) => b.clientId ) ).toEqual( [
				'a',
				'c',
				'b',
			] );
		} );

		it( 'should work when an uninvolved block is engaged', () => {
			const existingBlocks = [ blockA, blockB, blockC ];
			const result = mergeBlocks( existingBlocks, receivedBlocks, 0 ); // Engage A
			expect( result.map( ( b ) => b.clientId ) ).toEqual( [
				'a',
				'c',
				'b',
			] );
		} );

		it( 'should handle moved block with fresh clientIds and preserve engaged content', () => {
			const existingBlocks = [
				createBlock( 'a', 'Block A' ),
				createBlock( 'b', 'Block B' ),
				createBlock( 'c', 'Block C' ),
				createBlock( 'd', 'Block D' ),
			];
			// eslint-disable-next-line @typescript-eslint/no-shadow
			const receivedBlocks = [
				createBlock( 'new-a', 'Block A' ),
				createBlock( 'new-c', 'Block C' ),
				createBlock( 'new-b', 'Block B' ),
				createBlock( 'new-d', 'Block D' ),
			]; // B and C swapped
			const result = mergeBlocks( existingBlocks, receivedBlocks, 1 ); // B engaged
			expect( result.map( ( b ) => b.clientId ) ).toEqual( [
				'new-a',
				'new-c',
				'b',
				'new-d',
			] );

			// Also ensure content of all blocks are as expected
			const mergedBlockA = result.find( ( b ) => b.clientId === 'new-a' );
			const mergedBlockB = result.find( ( b ) => b.clientId === 'b' );
			const mergedBlockC = result.find( ( b ) => b.clientId === 'new-c' );
			const mergedBlockD = result.find( ( b ) => b.clientId === 'new-d' );
			expect( mergedBlockA?.attributes.content ).toBe( 'Block A' );
			expect( mergedBlockB?.attributes.content ).toBe( 'Block B' );
			expect( mergedBlockC?.attributes.content ).toBe( 'Block C' );
			expect( mergedBlockD?.attributes.content ).toBe( 'Block D' );
		} );
	} );

	describe( 'when a block is deleted', () => {
		const receivedBlocks = [ blockA, blockC ]; // B deleted

		it( 'should work when no block is engaged', () => {
			const existingBlocks = [ blockA, blockB, blockC ];
			const result = mergeBlocks( existingBlocks, receivedBlocks, -1 );
			expect( result.map( ( b ) => b.clientId ) ).toEqual( [ 'a', 'c' ] );
		} );

		it( 'should work when an uninvolved block is engaged', () => {
			const existingBlocks = [ blockA, blockB, blockC ];
			const result = mergeBlocks( existingBlocks, receivedBlocks, 0 ); // Engage A
			expect( result.map( ( b ) => b.clientId ) ).toEqual( [ 'a', 'c' ] );
		} );

		it( 'should re-insert a deleted engaged block', () => {
			const existingBlocks = [ blockA, engagedBlockB, blockC ];
			const result = mergeBlocks( existingBlocks, receivedBlocks, 1 ); // Engage B
			expect( result.map( ( b ) => b.clientId ) ).toEqual( [
				'a',
				'b',
				'c',
			] );
			const mergedEngagedBlock = result.find(
				( b ) => b.clientId === 'b'
			);
			expect( mergedEngagedBlock?.attributes.content ).toBe(
				'Engaged Block B'
			);
		} );
	} );

	describe( 'when a block is replaced', () => {
		const receivedBlocks = [ blockA, blockD, blockC ]; // B replaced with D

		it( 'should work when no block is engaged', () => {
			const existingBlocks = [ blockA, blockB, blockC ];
			const result = mergeBlocks( existingBlocks, receivedBlocks, -1 );
			expect( result.map( ( b ) => b.clientId ) ).toEqual( [
				'a',
				'd',
				'c',
			] );
		} );

		it( 'should work when an uninvolved block is engaged', () => {
			const existingBlocks = [ blockA, blockB, blockC ];
			const result = mergeBlocks( existingBlocks, receivedBlocks, 0 ); // Engage A
			expect( result.map( ( b ) => b.clientId ) ).toEqual( [
				'a',
				'd',
				'c',
			] );
		} );

		it( 'should re-insert a replaced engaged block', () => {
			const existingBlocks = [ blockA, engagedBlockB, blockC ];
			const result = mergeBlocks( existingBlocks, receivedBlocks, 1 ); // Engage B
			expect( result.map( ( b ) => b.clientId ) ).toEqual( [
				'a',
				'b',
				'c',
			] );
			const mergedEngagedBlock = result.find(
				( b ) => b.clientId === 'b'
			);
			expect( mergedEngagedBlock?.attributes.content ).toBe(
				'Engaged Block B'
			);
		} );
	} );

	describe( 'when a block is inserted', () => {
		const receivedBlocks = [ blockA, blockD, blockB, blockC ]; // D inserted

		it( 'should work when no block is engaged', () => {
			const existingBlocks = [ blockA, blockB, blockC ];
			const result = mergeBlocks( existingBlocks, receivedBlocks, -1 );
			expect( result.map( ( b ) => b.clientId ) ).toEqual( [
				'a',
				'd',
				'b',
				'c',
			] );
		} );

		it( 'should work when an uninvolved block is engaged', () => {
			const existingBlocks = [ blockA, blockB, blockC ];
			const result = mergeBlocks( existingBlocks, receivedBlocks, 0 ); // Engage A
			expect( result.map( ( b ) => b.clientId ) ).toEqual( [
				'a',
				'd',
				'b',
				'c',
			] );
		} );
	} );
} );
