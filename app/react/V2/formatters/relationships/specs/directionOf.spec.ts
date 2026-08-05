import { anchorOf, counterpartAnchorOf, directionOf, type RelationshipView } from '../types.js';

const outgoingView: RelationshipView = {
  _id: 'out',
  hub: 'hub-out',
  type: 'rel',
  relationTypeOnSelf: false,
  from: {
    type: 'textReference',
    entity: 'self',
    entityTitle: 'Self',
    entityTemplateId: 't1',
    file: 'f1',
    text: 'quoted',
    selections: [{ page: 1, top: 0, left: 0, width: 1, height: 1 }],
  },
  to: {
    type: 'entity',
    entity: 'target',
    entityTitle: 'Target',
    entityTemplateId: 't2',
  },
};

const incomingView: RelationshipView = {
  _id: 'in',
  hub: 'hub-in',
  type: 'rel',
  relationTypeOnSelf: true,
  from: {
    type: 'entity',
    entity: 'self',
    entityTitle: 'Self',
    entityTemplateId: 't1',
  },
  to: {
    type: 'textReference',
    entity: 'target',
    entityTitle: 'Target',
    entityTemplateId: 't2',
    file: 'f2',
    text: 'quoted',
    selections: [{ page: 2, top: 0, left: 0, width: 1, height: 1 }],
  },
};

describe('directionOf', () => {
  it('returns outgoing when the text anchor is on the self side', () => {
    expect(directionOf(outgoingView, 'self')).toBe('outgoing');
  });

  it('returns incoming when the text anchor is on the target side', () => {
    expect(directionOf(incomingView, 'self')).toBe('incoming');
  });

  it('returns outgoing for entity-level links where the partner carries the type', () => {
    const entityLevel: RelationshipView = {
      _id: 'el-out',
      hub: 'hub-el-out',
      type: 'rel',
      relationTypeOnSelf: false,
      from: {
        type: 'entity',
        entity: 'self',
        entityTitle: 'Self',
        entityTemplateId: 't1',
      },
      to: {
        type: 'entity',
        entity: 'target',
        entityTitle: 'Target',
        entityTemplateId: 't2',
      },
    };

    expect(directionOf(entityLevel, 'self')).toBe('outgoing');
  });

  it('returns incoming for entity-level links where self carries the type', () => {
    const entityLevel: RelationshipView = {
      _id: 'el-in',
      hub: 'hub-el-in',
      type: 'rel',
      relationTypeOnSelf: true,
      from: {
        type: 'entity',
        entity: 'self',
        entityTitle: 'Self',
        entityTemplateId: 't1',
      },
      to: {
        type: 'entity',
        entity: 'target',
        entityTitle: 'Target',
        entityTemplateId: 't2',
      },
    };

    expect(directionOf(entityLevel, 'self')).toBe('incoming');
  });
});

describe('anchorOf', () => {
  it('returns the self-side text reference', () => {
    expect(anchorOf(outgoingView, 'self')?.text).toBe('quoted');
  });

  it('returns undefined when the self side is entity-level', () => {
    expect(anchorOf(incomingView, 'self')).toBeUndefined();
  });
});

describe('counterpartAnchorOf', () => {
  it('returns the target-side text reference', () => {
    const view: RelationshipView = {
      ...outgoingView,
      to: {
        type: 'textReference',
        entity: 'target',
        entityTitle: 'Target',
        entityTemplateId: 't2',
        file: 'f2',
        text: 'target passage',
        selections: [{ page: 4, top: 0, left: 0, width: 1, height: 1 }],
      },
    };

    expect(counterpartAnchorOf(view, 'self')?.text).toBe('target passage');
  });

  it('returns undefined when the target side is entity-level', () => {
    expect(counterpartAnchorOf(outgoingView, 'self')).toBeUndefined();
  });
});
