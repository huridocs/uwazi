import {
  addLibraryEntity,
  applyLibraryClusterClick,
  applyLibraryEntityClick,
  orderedSelectionIds,
  type LibrarySelection,
} from '../librarySelection.js';

const orderedIds = ['mexico', 'ellacuria', 'gelman', 'other'];
const none: LibrarySelection = { ids: [] };
const plain = { shiftKey: false, ctrlKey: false, metaKey: false };

describe('addLibraryEntity', () => {
  it('adds the entity and keeps the ones already selected', () => {
    const next = addLibraryEntity({ ids: ['mexico'], anchorId: 'mexico' }, 'gelman');

    expect(next).toEqual({ ids: ['mexico', 'gelman'], anchorId: 'gelman' });
  });

  it('does not duplicate an entity that is already selected', () => {
    const next = addLibraryEntity({ ids: ['mexico', 'gelman'], anchorId: 'mexico' }, 'gelman');

    expect(next).toEqual({ ids: ['mexico', 'gelman'], anchorId: 'gelman' });
  });
});

describe('applyLibraryEntityClick', () => {
  it('replaces the selection with the clicked entity', () => {
    const next = applyLibraryEntityClick({
      selection: { ids: ['ellacuria', 'gelman'], anchorId: 'ellacuria' },
      orderedIds,
      clickedId: 'mexico',
      modifiers: plain,
      allowRange: true,
    });

    expect(next).toEqual({ ids: ['mexico'], anchorId: 'mexico' });
  });

  it('selects the inclusive range from the anchor through the clicked entity', () => {
    const fromStart = applyLibraryEntityClick({
      selection: { ids: ['mexico'], anchorId: 'mexico' },
      orderedIds,
      clickedId: 'gelman',
      modifiers: { ...plain, shiftKey: true },
      allowRange: true,
    });
    expect(fromStart.ids).toEqual(['mexico', 'ellacuria', 'gelman']);
    expect(fromStart.anchorId).toBe('mexico');

    const upward = applyLibraryEntityClick({
      selection: { ids: ['gelman'], anchorId: 'gelman' },
      orderedIds,
      clickedId: 'mexico',
      modifiers: { ...plain, shiftKey: true },
      allowRange: true,
    });
    expect(upward.ids).toEqual(['mexico', 'ellacuria', 'gelman']);
    expect(upward.anchorId).toBe('gelman');
  });

  it('keeps the anchor so a later shift click re-ranges from it', () => {
    const ranged = applyLibraryEntityClick({
      selection: { ids: ['mexico'], anchorId: 'mexico' },
      orderedIds,
      clickedId: 'gelman',
      modifiers: { ...plain, shiftKey: true },
      allowRange: true,
    });
    const narrowed = applyLibraryEntityClick({
      selection: ranged,
      orderedIds,
      clickedId: 'ellacuria',
      modifiers: { ...plain, shiftKey: true },
      allowRange: true,
    });
    expect(narrowed.ids).toEqual(['mexico', 'ellacuria']);
  });

  it('selects only the clicked entity when shift has no anchor', () => {
    const next = applyLibraryEntityClick({
      selection: none,
      orderedIds,
      clickedId: 'gelman',
      modifiers: { ...plain, shiftKey: true },
      allowRange: true,
    });
    expect(next).toEqual({ ids: ['gelman'], anchorId: 'gelman' });
  });

  it('does not range-select when the view disallows it', () => {
    const next = applyLibraryEntityClick({
      selection: { ids: ['mexico'], anchorId: 'mexico' },
      orderedIds,
      clickedId: 'gelman',
      modifiers: { ...plain, shiftKey: true },
      allowRange: false,
    });
    expect(next).toEqual({ ids: ['gelman'], anchorId: 'gelman' });
  });

  it('toggles an entity in or out when ctrl or cmd is held', () => {
    const added = applyLibraryEntityClick({
      selection: { ids: ['mexico'], anchorId: 'mexico' },
      orderedIds,
      clickedId: 'gelman',
      modifiers: { ...plain, ctrlKey: true },
      allowRange: true,
    });
    expect(added.ids).toEqual(['mexico', 'gelman']);
    expect(added.anchorId).toBe('gelman');

    const withCmd = applyLibraryEntityClick({
      selection: added,
      orderedIds,
      clickedId: 'ellacuria',
      modifiers: { ...plain, metaKey: true },
      allowRange: false,
    });
    expect(withCmd.ids).toEqual(['mexico', 'gelman', 'ellacuria']);

    const removed = applyLibraryEntityClick({
      selection: withCmd,
      orderedIds,
      clickedId: 'gelman',
      modifiers: { ...plain, ctrlKey: true },
      allowRange: true,
    });
    expect(removed.ids).toEqual(['mexico', 'ellacuria']);
  });
});

describe('applyLibraryClusterClick', () => {
  it('replaces the selection with every entity in the cluster', () => {
    const next = applyLibraryClusterClick({
      selection: { ids: ['other'], anchorId: 'other' },
      clusterIds: ['mexico', 'ellacuria', 'mexico'],
      modifiers: plain,
    });
    expect(next.ids).toEqual(['mexico', 'ellacuria']);
    expect(next.anchorId).toBe('mexico');
  });

  it('adds cluster entities, and toggles them off when they are already selected', () => {
    const added = applyLibraryClusterClick({
      selection: { ids: ['other'], anchorId: 'other' },
      clusterIds: ['mexico', 'ellacuria'],
      modifiers: { ...plain, metaKey: true },
    });
    expect(added.ids).toEqual(['other', 'mexico', 'ellacuria']);

    const removed = applyLibraryClusterClick({
      selection: added,
      clusterIds: ['mexico', 'ellacuria'],
      modifiers: { ...plain, ctrlKey: true },
    });
    expect(removed.ids).toEqual(['other']);
  });
});

describe('orderedSelectionIds', () => {
  it('lists selected entities in result order', () => {
    expect(
      orderedSelectionIds(['mexico', 'ellacuria', 'gelman', 'other'], ['gelman', 'mexico'])
    ).toEqual(['mexico', 'gelman']);
  });
});
