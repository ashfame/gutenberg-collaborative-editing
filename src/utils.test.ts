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
	const blockE = createBlock( 'e', 'Block E' );

	// We assume the engaged block has some modified content
	const engagedBlockA = createBlock( 'a', 'Engaged AAAA' );
	const engagedBlockB = createBlock( 'b', 'Engaged BBBB' );
	const engagedBlockC = createBlock( 'c', 'Engaged CCCC' );
	const engagedBlockD = createBlock( 'd', 'Engaged DDDD' );
	const engagedBlockE = createBlock( 'e', 'Engaged EEEE' );

	describe( 'when a block is moved', () => {
		describe( 'swapping two blocks', () => {
			describe( 'in the middle of the block list (B and C swapped)', () => {
				const existing = [ blockA, blockB, blockC, blockD ];
				const received = [ blockA, blockC, blockB, blockD ]; // B and C swapped

				it( 'should work when no block is engaged', () => {
					const engagedIndex = -1;
					const result = mergeBlocks(
						existing,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'a',
						'c',
						'b',
						'd',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block D' );
				} );
				it( 'should work when an uninvolved block is engaged (unmodified)', () => {
					const engagedIndex = 0; // Engage A
					const result = mergeBlocks(
						existing,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'a',
						'c',
						'b',
						'd',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block D' );
				} );
				it( 'should work when an uninvolved block is engaged (modified)', () => {
					const engagedIndex = 0; // Engage A
					const localExisting = [
						engagedBlockA,
						blockB,
						blockC,
						blockD,
					];
					const result = mergeBlocks(
						localExisting,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'a',
						'c',
						'b',
						'd',
					] );
					expect( result[ 0 ].attributes.content ).toBe(
						'Engaged AAAA'
					);
					expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block D' );
				} );
				it( 'should work when an involved block is engaged (unmodified)', () => {
					const engagedIndex = 1; // Engage B
					const result = mergeBlocks(
						existing,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'a',
						'c',
						'b',
						'd',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block D' );
				} );
				it( 'should work when an involved block is engaged (modified)', () => {
					const engagedIndex = 1; // Engage B
					const localExisting = [
						blockA,
						engagedBlockB,
						blockC,
						blockD,
					];
					const result = mergeBlocks(
						localExisting,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'a',
						'c',
						'b',
						'd',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 2 ].attributes.content ).toBe(
						'Engaged BBBB'
					);
					expect( result[ 3 ].attributes.content ).toBe( 'Block D' );
				} );
			} );

			describe( 'the first two blocks (A and B swapped)', () => {
				const existing = [ blockA, blockB, blockC, blockD ];
				const received = [ blockB, blockA, blockC, blockD ]; // A and B swapped
				it( 'should work when no block is engaged', () => {
					const engagedIndex = -1;
					const result = mergeBlocks(
						existing,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'b',
						'a',
						'c',
						'd',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block D' );
				} );
				it( 'should work when an uninvolved block is engaged (unmodified)', () => {
					const engagedIndex = 2; // Engage C
					const result = mergeBlocks(
						existing,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'b',
						'a',
						'c',
						'd',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block D' );
				} );
				it( 'should work when an uninvolved block is engaged (modified)', () => {
					const engagedIndex = 2; // Engage C
					const localExisting = [
						blockA,
						blockB,
						engagedBlockC,
						blockD,
					];
					const result = mergeBlocks(
						localExisting,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'b',
						'a',
						'c',
						'd',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 2 ].attributes.content ).toBe(
						'Engaged CCCC'
					);
					expect( result[ 3 ].attributes.content ).toBe( 'Block D' );
				} );
				it( 'should work when an involved block is engaged (unmodified)', () => {
					const engagedIndex = 0; // Engage A
					const result = mergeBlocks(
						existing,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'b',
						'a',
						'c',
						'd',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block D' );
				} );
				it( 'should work when an involved block is engaged (modified)', () => {
					const engagedIndex = 0; // Engage A
					const localExisting = [
						engagedBlockA,
						blockB,
						blockC,
						blockD,
					];
					const result = mergeBlocks(
						localExisting,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'b',
						'a',
						'c',
						'd',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 1 ].attributes.content ).toBe(
						'Engaged AAAA'
					);
					expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block D' );
				} );
			} );

			describe( 'the last two blocks (C and D swapped)', () => {
				const existing = [ blockA, blockB, blockC, blockD ];
				const received = [ blockA, blockB, blockD, blockC ]; // C and D swapped
				it( 'should work when no block is engaged', () => {
					const engagedIndex = -1;
					const result = mergeBlocks(
						existing,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'a',
						'b',
						'd',
						'c',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block D' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block C' );
				} );
				it( 'should work when an uninvolved block is engaged (unmodified)', () => {
					const engagedIndex = 0; // Engage A
					const result = mergeBlocks(
						existing,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'a',
						'b',
						'd',
						'c',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block D' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block C' );
				} );
				it( 'should work when an uninvolved block is engaged (modified)', () => {
					const engagedIndex = 0; // Engage A
					const localExisting = [
						engagedBlockA,
						blockB,
						blockC,
						blockD,
					];
					const result = mergeBlocks(
						localExisting,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'a',
						'b',
						'd',
						'c',
					] );
					expect( result[ 0 ].attributes.content ).toBe(
						'Engaged AAAA'
					);
					expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block D' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block C' );
				} );
				it( 'should work when an involved block is engaged (unmodified)', () => {
					const engagedIndex = 3; // Engage D
					const result = mergeBlocks(
						existing,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'a',
						'b',
						'd',
						'c',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block D' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block C' );
				} );
				it( 'should work when an involved block is engaged (modified)', () => {
					const engagedIndex = 3; // Engage D
					const localExisting = [
						blockA,
						blockB,
						blockC,
						engagedBlockD,
					];
					const result = mergeBlocks(
						localExisting,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'a',
						'b',
						'd',
						'c',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 2 ].attributes.content ).toBe(
						'Engaged DDDD'
					);
					expect( result[ 3 ].attributes.content ).toBe( 'Block C' );
				} );
			} );
		} );

		describe( 'dragging and dropping a block', () => {
			const existing = [ blockA, blockB, blockC, blockD, blockE ];

			describe( 'from the middle to another place in the middle (B from index 1 to 3)', () => {
				const received = [ blockA, blockC, blockD, blockB, blockE ];
				it( 'should work when no block is engaged', () => {
					const engagedIndex = -1;
					const result = mergeBlocks(
						existing,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'a',
						'c',
						'd',
						'b',
						'e',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block D' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 4 ].attributes.content ).toBe( 'Block E' );
				} );
				it( 'should work when an uninvolved block is engaged (unmodified)', () => {
					const engagedIndex = 0; // Engage A
					const result = mergeBlocks(
						existing,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'a',
						'c',
						'd',
						'b',
						'e',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block D' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 4 ].attributes.content ).toBe( 'Block E' );
				} );
				it( 'should work when an uninvolved block is engaged (modified)', () => {
					const engagedIndex = 0; // Engage A
					const localExisting = [
						engagedBlockA,
						blockB,
						blockC,
						blockD,
						blockE,
					];
					const result = mergeBlocks(
						localExisting,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'a',
						'c',
						'd',
						'b',
						'e',
					] );
					expect( result[ 0 ].attributes.content ).toBe(
						'Engaged AAAA'
					);
					expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block D' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 4 ].attributes.content ).toBe( 'Block E' );
				} );
				it( 'should work when an involved block is engaged (unmodified)', () => {
					const engagedIndex = 1; // Engage B
					const result = mergeBlocks(
						existing,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'a',
						'c',
						'd',
						'b',
						'e',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block D' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 4 ].attributes.content ).toBe( 'Block E' );
				} );
				it( 'should work when an involved block is engaged (modified)', () => {
					const engagedIndex = 1; // Engage B
					const localExisting = [
						blockA,
						engagedBlockB,
						blockC,
						blockD,
						blockE,
					];
					const result = mergeBlocks(
						localExisting,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'a',
						'c',
						'd',
						'b',
						'e',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block D' );
					expect( result[ 3 ].attributes.content ).toBe(
						'Engaged BBBB'
					);
					expect( result[ 4 ].attributes.content ).toBe( 'Block E' );
				} );
			} );

			describe( 'from the middle to the top (C from index 2 to 0)', () => {
				const received = [ blockC, blockA, blockB, blockD, blockE ];
				it( 'should work when no block is engaged', () => {
					const engagedIndex = -1;
					const result = mergeBlocks(
						existing,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'c',
						'a',
						'b',
						'd',
						'e',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block D' );
					expect( result[ 4 ].attributes.content ).toBe( 'Block E' );
				} );
				it( 'should work when an uninvolved block is engaged (unmodified)', () => {
					const engagedIndex = 0; // Engage A
					const result = mergeBlocks(
						existing,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'c',
						'a',
						'b',
						'd',
						'e',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block D' );
					expect( result[ 4 ].attributes.content ).toBe( 'Block E' );
				} );
				it( 'should work when an uninvolved block is engaged (modified)', () => {
					const engagedIndex = 0; // Engage A
					const localExisting = [
						engagedBlockA,
						blockB,
						blockC,
						blockD,
						blockE,
					];
					const result = mergeBlocks(
						localExisting,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'c',
						'a',
						'b',
						'd',
						'e',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 1 ].attributes.content ).toBe(
						'Engaged AAAA'
					);
					expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block D' );
					expect( result[ 4 ].attributes.content ).toBe( 'Block E' );
				} );
				it( 'should work when an involved block is engaged (unmodified)', () => {
					const engagedIndex = 2; // Engage C
					const result = mergeBlocks(
						existing,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'c',
						'a',
						'b',
						'd',
						'e',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block D' );
					expect( result[ 4 ].attributes.content ).toBe( 'Block E' );
				} );
				it( 'should work when an involved block is engaged (modified)', () => {
					const engagedIndex = 2; // Engage C
					const localExisting = [
						blockA,
						blockB,
						engagedBlockC,
						blockD,
						blockE,
					];
					const result = mergeBlocks(
						localExisting,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'c',
						'a',
						'b',
						'd',
						'e',
					] );
					expect( result[ 0 ].attributes.content ).toBe(
						'Engaged CCCC'
					);
					expect( result[ 1 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block D' );
					expect( result[ 4 ].attributes.content ).toBe( 'Block E' );
				} );
			} );

			describe( 'from the middle to the bottom (C from index 2 to 4)', () => {
				const received = [ blockA, blockB, blockD, blockE, blockC ];
				it( 'should work when no block is engaged', () => {
					const engagedIndex = -1;
					const result = mergeBlocks(
						existing,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'a',
						'b',
						'd',
						'e',
						'c',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block D' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block E' );
					expect( result[ 4 ].attributes.content ).toBe( 'Block C' );
				} );
				it( 'should work when an uninvolved block is engaged (unmodified)', () => {
					const engagedIndex = 0; // Engage A
					const result = mergeBlocks(
						existing,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'a',
						'b',
						'd',
						'e',
						'c',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block D' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block E' );
					expect( result[ 4 ].attributes.content ).toBe( 'Block C' );
				} );
				it( 'should work when an uninvolved block is engaged (modified)', () => {
					const engagedIndex = 0; // Engage A
					const localExisting = [
						engagedBlockA,
						blockB,
						blockC,
						blockD,
						blockE,
					];
					const result = mergeBlocks(
						localExisting,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'a',
						'b',
						'd',
						'e',
						'c',
					] );
					expect( result[ 0 ].attributes.content ).toBe(
						'Engaged AAAA'
					);
					expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block D' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block E' );
					expect( result[ 4 ].attributes.content ).toBe( 'Block C' );
				} );
				it( 'should work when an involved block is engaged (unmodified)', () => {
					const engagedIndex = 2; // Engage C
					const result = mergeBlocks(
						existing,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'a',
						'b',
						'd',
						'e',
						'c',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block D' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block E' );
					expect( result[ 4 ].attributes.content ).toBe( 'Block C' );
				} );
				it( 'should work when an involved block is engaged (modified)', () => {
					const engagedIndex = 2; // Engage C
					const localExisting = [
						blockA,
						blockB,
						engagedBlockC,
						blockD,
						blockE,
					];
					const result = mergeBlocks(
						localExisting,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'a',
						'b',
						'd',
						'e',
						'c',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block D' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block E' );
					expect( result[ 4 ].attributes.content ).toBe(
						'Engaged CCCC'
					);
				} );
			} );

			describe( 'from the top to the middle (A from index 0 to 2)', () => {
				const received = [ blockB, blockC, blockA, blockD, blockE ];
				it( 'should work when no block is engaged', () => {
					const engagedIndex = -1;
					const result = mergeBlocks(
						existing,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'b',
						'c',
						'a',
						'd',
						'e',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block D' );
					expect( result[ 4 ].attributes.content ).toBe( 'Block E' );
				} );
				it( 'should work when an uninvolved block is engaged (unmodified)', () => {
					const engagedIndex = 1; // Engage B
					const result = mergeBlocks(
						existing,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'b',
						'c',
						'a',
						'd',
						'e',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block D' );
					expect( result[ 4 ].attributes.content ).toBe( 'Block E' );
				} );
				it( 'should work when an uninvolved block is engaged (modified)', () => {
					const engagedIndex = 1; // Engage B
					const localExisting = [
						blockA,
						engagedBlockB,
						blockC,
						blockD,
						blockE,
					];
					const result = mergeBlocks(
						localExisting,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'b',
						'c',
						'a',
						'd',
						'e',
					] );
					expect( result[ 0 ].attributes.content ).toBe(
						'Engaged BBBB'
					);
					expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block D' );
					expect( result[ 4 ].attributes.content ).toBe( 'Block E' );
				} );
				it( 'should work when an involved block is engaged (unmodified)', () => {
					const engagedIndex = 0; // Engage A
					const result = mergeBlocks(
						existing,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'b',
						'c',
						'a',
						'd',
						'e',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block D' );
					expect( result[ 4 ].attributes.content ).toBe( 'Block E' );
				} );
				it( 'should work when an involved block is engaged (modified)', () => {
					const engagedIndex = 0; // Engage A
					const localExisting = [
						engagedBlockA,
						blockB,
						blockC,
						blockD,
						blockE,
					];
					const result = mergeBlocks(
						localExisting,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'b',
						'c',
						'a',
						'd',
						'e',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 2 ].attributes.content ).toBe(
						'Engaged AAAA'
					);
					expect( result[ 3 ].attributes.content ).toBe( 'Block D' );
					expect( result[ 4 ].attributes.content ).toBe( 'Block E' );
				} );
			} );

			describe( 'from the top to the bottom (A from index 0 to 4)', () => {
				const received = [ blockB, blockC, blockD, blockE, blockA ];
				it( 'should work when no block is engaged', () => {
					const engagedIndex = -1;
					const result = mergeBlocks(
						existing,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'b',
						'c',
						'd',
						'e',
						'a',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block D' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block E' );
					expect( result[ 4 ].attributes.content ).toBe( 'Block A' );
				} );
				it( 'should work when an uninvolved block is engaged (unmodified)', () => {
					const engagedIndex = 1; // Engage B
					const result = mergeBlocks(
						existing,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'b',
						'c',
						'd',
						'e',
						'a',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block D' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block E' );
					expect( result[ 4 ].attributes.content ).toBe( 'Block A' );
				} );
				it( 'should work when an uninvolved block is engaged (modified)', () => {
					const engagedIndex = 1; // Engage B
					const localExisting = [
						blockA,
						engagedBlockB,
						blockC,
						blockD,
						blockE,
					];
					const result = mergeBlocks(
						localExisting,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'b',
						'c',
						'd',
						'e',
						'a',
					] );
					expect( result[ 0 ].attributes.content ).toBe(
						'Engaged BBBB'
					);
					expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block D' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block E' );
					expect( result[ 4 ].attributes.content ).toBe( 'Block A' );
				} );
				it( 'should work when an involved block is engaged (unmodified)', () => {
					const engagedIndex = 0; // Engage A
					const result = mergeBlocks(
						existing,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'b',
						'c',
						'd',
						'e',
						'a',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block D' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block E' );
					expect( result[ 4 ].attributes.content ).toBe( 'Block A' );
				} );
				it( 'should work when an involved block is engaged (modified)', () => {
					const engagedIndex = 0; // Engage A
					const localExisting = [
						engagedBlockA,
						blockB,
						blockC,
						blockD,
						blockE,
					];
					const result = mergeBlocks(
						localExisting,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'b',
						'c',
						'd',
						'e',
						'a',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block D' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block E' );
					expect( result[ 4 ].attributes.content ).toBe(
						'Engaged AAAA'
					);
				} );
			} );

			describe( 'from the bottom to the middle (E from index 4 to 2)', () => {
				const received = [ blockA, blockB, blockE, blockC, blockD ];
				it( 'should work when no block is engaged', () => {
					const engagedIndex = -1;
					const result = mergeBlocks(
						existing,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'a',
						'b',
						'e',
						'c',
						'd',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block E' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 4 ].attributes.content ).toBe( 'Block D' );
				} );
				it( 'should work when an uninvolved block is engaged (unmodified)', () => {
					const engagedIndex = 0; // Engage A
					const result = mergeBlocks(
						existing,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'a',
						'b',
						'e',
						'c',
						'd',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block E' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 4 ].attributes.content ).toBe( 'Block D' );
				} );
				it( 'should work when an uninvolved block is engaged (modified)', () => {
					const engagedIndex = 0; // Engage A
					const localExisting = [
						engagedBlockA,
						blockB,
						blockC,
						blockD,
						blockE,
					];
					const result = mergeBlocks(
						localExisting,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'a',
						'b',
						'e',
						'c',
						'd',
					] );
					expect( result[ 0 ].attributes.content ).toBe(
						'Engaged AAAA'
					);
					expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block E' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 4 ].attributes.content ).toBe( 'Block D' );
				} );
				it( 'should work when an involved block is engaged (unmodified)', () => {
					const engagedIndex = 4; // Engage E
					const result = mergeBlocks(
						existing,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'a',
						'b',
						'e',
						'c',
						'd',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block E' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 4 ].attributes.content ).toBe( 'Block D' );
				} );
				it( 'should work when an involved block is engaged (modified)', () => {
					const engagedIndex = 4; // Engage E
					const localExisting = [
						blockA,
						blockB,
						blockC,
						blockD,
						engagedBlockE,
					];
					const result = mergeBlocks(
						localExisting,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'a',
						'b',
						'e',
						'c',
						'd',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 2 ].attributes.content ).toBe(
						'Engaged EEEE'
					);
					expect( result[ 3 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 4 ].attributes.content ).toBe( 'Block D' );
				} );
			} );

			describe( 'from the bottom to the top (E from index 4 to 0)', () => {
				const received = [ blockE, blockA, blockB, blockC, blockD ];
				it( 'should work when no block is engaged', () => {
					const engagedIndex = -1;
					const result = mergeBlocks(
						existing,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'e',
						'a',
						'b',
						'c',
						'd',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block E' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 4 ].attributes.content ).toBe( 'Block D' );
				} );
				it( 'should work when an uninvolved block is engaged (unmodified)', () => {
					const engagedIndex = 1; // Engage B
					const result = mergeBlocks(
						existing,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'e',
						'a',
						'b',
						'c',
						'd',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block E' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 4 ].attributes.content ).toBe( 'Block D' );
				} );
				it( 'should work when an uninvolved block is engaged (modified)', () => {
					const engagedIndex = 1; // Engage B
					const localExisting = [
						blockA,
						engagedBlockB,
						blockC,
						blockD,
						blockE,
					];
					const result = mergeBlocks(
						localExisting,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'e',
						'a',
						'b',
						'c',
						'd',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block E' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 2 ].attributes.content ).toBe(
						'Engaged BBBB'
					);
					expect( result[ 3 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 4 ].attributes.content ).toBe( 'Block D' );
				} );
				it( 'should work when an involved block is engaged (unmodified)', () => {
					const engagedIndex = 4; // Engage E
					const result = mergeBlocks(
						existing,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'e',
						'a',
						'b',
						'c',
						'd',
					] );
					expect( result[ 0 ].attributes.content ).toBe( 'Block E' );
					expect( result[ 1 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 4 ].attributes.content ).toBe( 'Block D' );
				} );
				it( 'should work when an involved block is engaged (modified)', () => {
					const engagedIndex = 4; // Engage E
					const localExisting = [
						blockA,
						blockB,
						blockC,
						blockD,
						engagedBlockE,
					];
					const result = mergeBlocks(
						localExisting,
						received,
						engagedIndex
					);
					expect( result.map( ( b ) => b.clientId ) ).toEqual( [
						'e',
						'a',
						'b',
						'c',
						'd',
					] );
					expect( result[ 0 ].attributes.content ).toBe(
						'Engaged EEEE'
					);
					expect( result[ 1 ].attributes.content ).toBe( 'Block A' );
					expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
					expect( result[ 3 ].attributes.content ).toBe( 'Block C' );
					expect( result[ 4 ].attributes.content ).toBe( 'Block D' );
				} );
			} );
		} );
	} );

	describe( 'when a block is deleted', () => {
		describe( 'from the middle', () => {
			const received = [ blockA, blockC ]; // B deleted

			it( 'should work when no block is engaged', () => {
				const engagedIndex = -1;
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should work when an uninvolved block is engaged (unmodified)', () => {
				const engagedIndex = 0; // Engage A
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should work when an uninvolved block is engaged (modified)', () => {
				const engagedIndex = 0; // Engage A
				const existing = [
					createBlock( 'a', 'Engaged AAAA' ),
					blockB,
					blockC,
				];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Engaged AAAA' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should re-insert a deleted engaged block (unmodified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should re-insert a deleted engaged block (modified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [ blockA, engagedBlockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Engaged BBBB' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );
		} );

		describe( 'from the beginning', () => {
			const received = [ blockB, blockC ]; // A deleted

			it( 'should work when no block is engaged', () => {
				const engagedIndex = -1;
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should work when an uninvolved block is engaged (unmodified)', () => {
				const engagedIndex = 2; // Engage C
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
			} );
			it( 'should work when an uninvolved block is engaged (modified)', () => {
				const engagedIndex = 2; // Engage C
				const existing = [
					blockA,
					blockB,
					createBlock( 'c', 'Block CCCC' ),
				];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block CCCC' );
			} );

			it( 'should re-insert a deleted engaged block (unmodified)', () => {
				const engagedIndex = 0; // Engage A
				const existing = [ blockA, blockB, blockC ]; // A is engaged
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should re-insert a deleted engaged block (modified)', () => {
				const engagedIndex = 0; // Engage A
				const localEngagedBlockA = createBlock(
					'a',
					'Engaged Block A'
				);
				const existing = [ localEngagedBlockA, blockB, blockC ]; // A is engaged
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe(
					'Engaged Block A'
				);
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );
		} );

		describe( 'from the end', () => {
			const received = [ blockA, blockB ]; // C deleted

			it( 'should work when no block is engaged', () => {
				const engagedIndex = -1;
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
			} );

			it( 'should work when an uninvolved block is engaged (unmodified)', () => {
				const engagedIndex = 0; // Engage A
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
			} );

			it( 'should work when an uninvolved block is engaged (modified)', () => {
				const engagedIndex = 0; // Engage A
				const existing = [
					createBlock( 'a', 'Engaged AAAA' ),
					blockB,
					blockC,
				];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Engaged AAAA' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
			} );

			it( 'should re-insert a deleted engaged block (modified)', () => {
				const engagedIndex = 2; // Engage C
				const localEngagedBlockC = createBlock(
					'c',
					'Engaged Block C'
				);
				const existing = [ blockA, blockB, localEngagedBlockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 2 ].attributes.content ).toBe(
					'Engaged Block C'
				);
			} );

			it( 'should re-insert a deleted engaged block (unmodified)', () => {
				const engagedIndex = 2; // Engage C
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );
		} );
	} );

	// UPDATE of a block is essentially a REPLACE since client IDs differ
	describe( 'when a block is replaced', () => {
		describe( 'in the middle', () => {
			const received = [ blockA, blockD, blockC ]; // B replaced with D

			it( 'should work when no block is engaged', () => {
				const engagedIndex = -1;
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'd',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should work when an uninvolved block is engaged (unmodified)', () => {
				const engagedIndex = 0; // Engage A
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'd',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should work when an uninvolved block is engaged (modified)', () => {
				const engagedIndex = 0; // Engage A
				const existing = [
					createBlock( 'a', 'Engaged AAAA' ),
					blockB,
					blockC,
				];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'd',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Engaged AAAA' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should re-insert a replaced engaged block (unmodified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should re-insert a replaced engaged block (modified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [ blockA, engagedBlockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Engaged BBBB' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );
		} );
		describe( 'at the beginning', () => {
			const received = [ blockD, blockB, blockC ]; // A replaced with D

			it( 'should work when no block is engaged', () => {
				const engagedIndex = -1;
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'd',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should work when an uninvolved block is engaged (unmodified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'd',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should work when an uninvolved block is engaged (modified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [
					blockA,
					createBlock( 'b', 'Engaged BBBB' ),
					blockC,
				];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'd',
					'b',
					'c',
				] );

				expect( result[ 0 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 1 ].attributes.content ).toBe( 'Engaged BBBB' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should re-insert a replaced engaged block (modified)', () => {
				const engagedIndex = 0; // Engage A
				const localEngagedBlockA = createBlock( 'a', 'Engaged AAAA' );
				const existing = [ localEngagedBlockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Engaged AAAA' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should re-insert a replaced engaged block (unmodified)', () => {
				const engagedIndex = 0; // Engage A
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );
		} );
		describe( 'at the end', () => {
			const received = [ blockA, blockB, blockD ]; // C replaced with D

			it( 'should work when no block is engaged', () => {
				const engagedIndex = -1;
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'd',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block D' );
			} );

			it( 'should work when an uninvolved block is engaged (unmodified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'd',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block D' );
			} );

			it( 'should work when an uninvolved block is engaged (modified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [
					blockA,
					createBlock( 'b', 'Engaged BBBB' ),
					blockC,
				];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'd',
				] );

				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Engaged BBBB' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block D' );
			} );

			it( 'should re-insert a replaced engaged block (modified)', () => {
				const engagedIndex = 2; // Engage C
				const localEngagedBlockC = createBlock(
					'c',
					'Engaged Block C'
				);
				const existing = [ blockA, blockB, localEngagedBlockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 2 ].attributes.content ).toBe(
					'Engaged Block C'
				);
			} );
			it( 'should re-insert a replaced engaged block (unmodified)', () => {
				const engagedIndex = 2; // Engage C
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );
		} );
	} );

	describe( 'when a block is inserted', () => {
		describe( 'in the middle', () => {
			const received = [ blockA, blockD, blockB, blockC ]; // D inserted

			it( 'should work when no block is engaged', () => {
				const engagedIndex = -1; // no engaged block
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'd',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 3 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should work when a block `before` the insertion point is engaged (unmodified)', () => {
				const engagedIndex = 0; // Engage A
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'd',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 3 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should work when a block `before` the insertion point is engaged (modified)', () => {
				const engagedIndex = 0; // Engage A
				const existing = [
					createBlock( 'a', 'Block AAAA' ),
					blockB,
					blockC,
				];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'd',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block AAAA' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 3 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should work when a block `at` insertion point is engaged (unmodified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'd',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 3 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should work when a block `at` insertion point is engaged (modified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [
					blockA,
					createBlock( 'b', 'Engaged BBBB' ),
					blockC,
				];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'd',
					'b',
					'c',
				] );

				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 2 ].attributes.content ).toBe( 'Engaged BBBB' );
				expect( result[ 3 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should work when a block `after` the insertion point is engaged (unmodified)', () => {
				const engagedIndex = 2; // Engage C
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'd',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 3 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should work when a block `after` the insertion point is engaged (modified)', () => {
				const engagedIndex = 2; // Engage C
				const existing = [
					blockA,
					blockB,
					createBlock( 'c', 'Block CCCC' ),
				];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'd',
					'b',
					'c',
				] );

				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 3 ].attributes.content ).toBe( 'Block CCCC' );
			} );
		} );

		describe( 'at the beginning', () => {
			const received = [ blockD, blockA, blockB, blockC ]; // D inserted at the start

			it( 'should work when no block is engaged', () => {
				const engagedIndex = -1;
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'd',
					'a',
					'b',
					'c',
				] );
			} );

			it( 'should work when first block is engaged (unmodified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'd',
					'a',
					'b',
					'c',
				] );

				expect( result[ 0 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 3 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should work when first block is engaged (modified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [
					blockA,
					createBlock( 'b', 'Engaged BBBB' ),
					blockC,
				];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'd',
					'a',
					'b',
					'c',
				] );

				expect( result[ 0 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 2 ].attributes.content ).toBe( 'Engaged BBBB' );
				expect( result[ 3 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should work when a block `after` insertion point is engaged (unmodified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'd',
					'a',
					'b',
					'c',
				] );

				expect( result[ 0 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 3 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should work when a block `after` insertion point is engaged (modified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [
					blockA,
					createBlock( 'b', 'Engaged BBBB' ),
					blockC,
				];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'd',
					'a',
					'b',
					'c',
				] );

				expect( result[ 0 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 2 ].attributes.content ).toBe( 'Engaged BBBB' );
				expect( result[ 3 ].attributes.content ).toBe( 'Block C' );
			} );
		} );

		describe( 'at the end', () => {
			const received = [ blockA, blockB, blockC, blockD ]; // D inserted at the end

			it( 'should work when no block is engaged', () => {
				const engagedIndex = -1;
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
					'd',
				] );
			} );

			it( 'should work when last block is engaged (unmodified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
					'd',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
				expect( result[ 3 ].attributes.content ).toBe( 'Block D' );
			} );

			it( 'should work when last block is engaged (modified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [
					blockA,
					createBlock( 'b', 'Engaged BBBB' ),
					blockC,
				];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
					'd',
				] );

				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Engaged BBBB' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
				expect( result[ 3 ].attributes.content ).toBe( 'Block D' );
			} );

			it( 'should work when a block `before` insertion point is engaged (unmodified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
					'd',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
				expect( result[ 3 ].attributes.content ).toBe( 'Block D' );
			} );

			it( 'should work when a block `before` insertion point is engaged (modified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [
					blockA,
					createBlock( 'b', 'Engaged BBBB' ),
					blockC,
				];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
					'd',
				] );

				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Engaged BBBB' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
				expect( result[ 3 ].attributes.content ).toBe( 'Block D' );
			} );
		} );
	} );

	// Doesn't usually happen, but if it ever did, we test for the behavior
	describe( 'when an engaged block somehow comes in modified', () => {
		describe( 'in the middle', () => {
			it( 'should prioritize local modifications in engaged block', () => {
				const received = [ blockA, createBlock( 'b', 'bbbb' ), blockC ];
				const engagedIndex = 1; // Engage B

				const existing = [ blockA, engagedBlockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );

				// The engaged block from received should be in the result.
				expect( result[ 1 ].attributes.content ).toBe( 'Engaged BBBB' );
			} );
		} );

		describe( 'at the beginning', () => {
			it( 'should prioritize local modifications in engaged block', () => {
				const received = [ createBlock( 'a', 'aaaa' ), blockB, blockC ];
				const engagedIndex = 0; // Engage A
				const localEngagedBlockA = createBlock( 'a', 'Engaged AAAA' );

				const existing = [ localEngagedBlockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );

				expect( result[ 0 ].attributes.content ).toBe( 'Engaged AAAA' );
			} );
		} );

		describe( 'at the end', () => {
			it( 'should prioritize local modifications in engaged block', () => {
				const received = [ blockA, blockB, createBlock( 'c', 'cccc' ) ];
				const engagedIndex = 2; // Engage C
				const localEngagedBlockC = createBlock( 'c', 'Engaged CCCC' );

				const existing = [ blockA, blockB, localEngagedBlockC ];
				const result = mergeBlocks( existing, received, engagedIndex );

				expect( result[ 2 ].attributes.content ).toBe( 'Engaged CCCC' );
			} );
		} );
	} );

	it( 'should preserve engaged block (unmodified) even if all blocks are deleted', () => {
		const engagedIndex = 1; // Engage B

		const existing = [ blockA, blockB, blockC ];
		const result = mergeBlocks( existing, [], engagedIndex );

		expect( result.map( ( b ) => b.clientId ) ).toEqual( [ 'b' ] );
	} );

	it( 'should preserve engaged block (modified) even if all blocks are deleted', () => {
		const engagedIndex = 1; // Engage B

		const existing = [ blockA, engagedBlockB, blockC ];
		const result = mergeBlocks( existing, [], engagedIndex );

		expect( result.map( ( b ) => b.clientId ) ).toEqual( [ 'b' ] );
	} );
} );
