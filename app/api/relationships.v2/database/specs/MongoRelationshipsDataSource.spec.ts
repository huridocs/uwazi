import { MatchQueryNode } from 'api/relationships.v2/model/MatchQueryNode';
import { TraversalQueryNode } from 'api/relationships.v2/model/TraversalQueryNode';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { Relationship } from 'api/relationships.v2/model/Relationship';
import { MongoRelationshipsDataSource } from '../MongoRelationshipsDataSource';

const factory = getFixturesFactory();

const entityInLanguages = (langs: string[], id: string, template?: string) =>
  langs.map(lang => factory.entity(id, template, {}, { language: lang }));

const fixtures = {
  relationships: [
    {
      _id: factory.id('rel1'),
      from: { entity: 'entity1' },
      to: { entity: 'hub1' },
      type: factory.id('nullType'),
    },
    {
      _id: factory.id('rel2'),
      to: { entity: 'hub1' },
      from: { entity: 'entity3' },
      type: factory.id('relType1'),
    },
    {
      _id: factory.id('rel3'),
      to: { entity: 'hub1' },
      from: { entity: 'entity4' },
      type: factory.id('relType1'),
    },
    {
      _id: factory.id('rel4'),
      from: { entity: 'entity1' },
      to: { entity: 'hub2' },
      type: factory.id('nullType'),
    },
    {
      _id: factory.id('rel5'),
      to: { entity: 'hub2' },
      from: { entity: 'entity5' },
      type: factory.id('relType2'),
    },
    {
      _id: factory.id('rel6'),
      to: { entity: 'hub2' },
      from: { entity: 'entity6' },
      type: factory.id('relType3'),
    },
    {
      _id: factory.id('rel7'),
      from: { entity: 'entity2' },
      to: { entity: 'hub3' },
      type: factory.id('relType4'),
    },
    {
      _id: factory.id('rel8'),
      to: { entity: 'hub3', file: factory.id('file1') },
      from: { entity: 'entity7' },
      type: factory.id('relType5'),
    },
    {
      _id: factory.id('rel9'),
      from: { entity: 'entity7', file: factory.id('file1') },
      to: { entity: 'entity1' },
      type: factory.id('relType5'),
    },
  ],
  entities: [
    ...entityInLanguages(['en', 'es'], 'entity1', 'template1'),
    ...entityInLanguages(['en', 'es'], 'entity2', 'otherTemplate'),
    ...entityInLanguages(['en', 'es'], 'hub1', 'formerHubsTemplate'),
    ...entityInLanguages(['en', 'es'], 'entity3', 'template2'),
    ...entityInLanguages(['en', 'es'], 'entity4', 'template4'),
    ...entityInLanguages(['en', 'es'], 'hub2', 'formerHubsTemplate'),
    ...entityInLanguages(['en', 'es'], 'entity5', 'template2'),
    ...entityInLanguages(['en', 'es'], 'entity6', 'template3'),
    ...entityInLanguages(['en', 'es'], 'hub3', 'otherTemplate'),
    ...entityInLanguages(['en', 'es'], 'entity7', 'otherTemplate'),
    ...entityInLanguages(['en', 'es'], 'entity8', 'otherTemplate'),
  ],
};

let ds: MongoRelationshipsDataSource;

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
  ds = new MongoRelationshipsDataSource(testingDB.mongodb!, DefaultTransactionManager());
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('When getting by query', () => {
  it('should allow traversing 1 hop', async () => {
    const query = new MatchQueryNode({ sharedId: 'entity1' }, [
      new TraversalQueryNode('out', {}, [new MatchQueryNode()]),
    ]);

    const result = await ds.getByQuery(query, 'en').all();
    expect(result).toMatchObject([
      { _id: factory.id('hub1-en').toString(), sharedId: 'hub1' },
      { _id: factory.id('hub2-en').toString(), sharedId: 'hub2' },
    ]);
  });

  it('should allow traversing 2 hops', async () => {
    const query = new MatchQueryNode({ sharedId: 'entity1' }, [
      new TraversalQueryNode('out', {}, [
        new MatchQueryNode({}, [new TraversalQueryNode('in', {}, [new MatchQueryNode()])]),
      ]),
    ]);

    const result = await ds.getByQuery(query, 'en').all();
    expect(result).toMatchObject([
      { _id: factory.id('entity3-en').toString(), sharedId: 'entity3' },
      { _id: factory.id('entity4-en').toString(), sharedId: 'entity4' },
      { _id: factory.id('entity5-en').toString(), sharedId: 'entity5' },
      { _id: factory.id('entity6-en').toString(), sharedId: 'entity6' },
    ]);
  });

  it('should be paginable', async () => {
    const query = new MatchQueryNode({ sharedId: 'entity1' }, [
      new TraversalQueryNode('out', {}, [
        new MatchQueryNode({}, [new TraversalQueryNode('in', {}, [new MatchQueryNode()])]),
      ]),
    ]);

    const result = await ds.getByQuery(query, 'en').page(2, 2);
    expect(result).toMatchObject([
      { _id: factory.id('entity5-en').toString(), sharedId: 'entity5' },
      { _id: factory.id('entity6-en').toString(), sharedId: 'entity6' },
    ]);
  });

  it('should allow to add filters to the query', async () => {
    const query = new MatchQueryNode({ sharedId: 'entity1' }, [
      new TraversalQueryNode('out', {}, [
        new MatchQueryNode({}, [
          new TraversalQueryNode('in', { types: [factory.id('relType3').toHexString()] }, [
            new MatchQueryNode({
              templates: [
                factory.id('template3').toHexString(),
                factory.id('template4').toHexString(),
              ],
            }),
          ]),
        ]),
      ]),
    ]);

    const result = await ds.getByQuery(query, 'en').all();
    expect(result).toMatchObject([
      { _id: factory.id('entity6-en').toString(), sharedId: 'entity6' },
    ]);
  });

  it('should allow to query branches', async () => {
    const query = new MatchQueryNode({ sharedId: 'entity1' }, [
      new TraversalQueryNode('out', {}, [
        new MatchQueryNode({}, [
          new TraversalQueryNode('in', { types: [factory.id('relType3').toHexString()] }, [
            new MatchQueryNode({
              templates: [
                factory.id('template3').toHexString(),
                factory.id('template4').toHexString(),
              ],
            }),
          ]),
        ]),
      ]),
      new TraversalQueryNode('in', {}, [new MatchQueryNode()]),
    ]);

    const result = await ds.getByQuery(query, 'en').all();
    expect(result).toMatchObject([
      { _id: factory.id('entity6-en').toString(), sharedId: 'entity6' },
      { _id: factory.id('entity7-en').toString(), sharedId: 'entity7' },
    ]);
  });

  it('should return the same entities when querying different languages', async () => {
    const query = new MatchQueryNode({ sharedId: 'entity1' }, [
      new TraversalQueryNode('out', {}, [
        new MatchQueryNode({}, [
          new TraversalQueryNode('in', { types: [factory.id('relType3').toHexString()] }, [
            new MatchQueryNode({
              templates: [
                factory.id('template3').toHexString(),
                factory.id('template4').toHexString(),
              ],
            }),
          ]),
        ]),
      ]),
      new TraversalQueryNode('in', {}, [new MatchQueryNode()]),
    ]);

    const resultInEnglish = await ds.getByQuery(query, 'en').all();
    const resultInSpanish = await ds.getByQuery(query, 'es').all();
    expect(resultInEnglish).toMatchObject([
      { _id: factory.id('entity6-en').toString(), sharedId: 'entity6' },
      { _id: factory.id('entity7-en').toString(), sharedId: 'entity7' },
    ]);
    expect(resultInSpanish).toMatchObject([
      { _id: factory.id('entity6-es').toString(), sharedId: 'entity6' },
      { _id: factory.id('entity7-es').toString(), sharedId: 'entity7' },
    ]);
  });
});

describe('getByEntities()', () => {
  it('should return the relationships of the given entities', async () => {
    const result = await ds.getByEntities(['entity1', 'entity2']).all();
    expect(result).toMatchObject([
      {
        _id: factory.id('rel1').toString(),
        from: { entity: 'entity1' },
        to: { entity: 'hub1' },
        type: factory.id('nullType').toString(),
      },
      {
        _id: factory.id('rel4').toString(),
        from: { entity: 'entity1' },
        to: { entity: 'hub2' },
        type: factory.id('nullType').toString(),
      },
      {
        _id: factory.id('rel7').toString(),
        from: { entity: 'entity2' },
        to: { entity: 'hub3' },
        type: factory.id('relType4').toString(),
      },
      {
        _id: factory.id('rel9').toString(),
        from: { entity: 'entity7' },
        to: { entity: 'entity1' },
        type: factory.id('relType5').toString(),
      },
    ]);
  });
});

describe('deleteAll()', () => {
  it('should delete all relationships', async () => {
    await ds.deleteAll();
    const rels = await testingDB.mongodb!.collection('relationships').find().toArray();
    expect(rels).toEqual([]);
  });
});

describe('getAll()', () => {
  it('should return all relationships', async () => {
    const rels = await ds.getAll().all();
    expect(rels).toHaveLength(9);
  });
});

describe('getByefinition()', () => {
  it('should find the relationships from sourceEntity to targetEntity of the provided type', async () => {
    const rels = await ds
      .getByDefinition('entity1', factory.id('nullType').toString(), 'hub1')
      .all();
    expect(rels).toEqual([expect.objectContaining({ _id: factory.id('rel1').toString() })]);
    rels.forEach(rel => {
      expect(rel).toBeInstanceOf(Relationship);
    });
  });

  it('should only find relationships that are not text references', async () => {
    expect(
      await ds.getByDefinition('entity7', factory.id('relType5').toString(), 'hub3').all()
    ).toEqual([]);

    expect(
      await ds.getByDefinition('entity7', factory.id('relType5').toString(), 'entity1').all()
    ).toEqual([]);
  });
});
