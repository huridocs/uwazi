import { MatchQueryNode } from 'api/relationships.v2/model/MatchQueryNode';
import { TraversalQueryNode } from 'api/relationships.v2/model/TraversalQueryNode';
import { getFixturesFactory } from 'api/utils/fixturesFactory';

const fixtureFactory = getFixturesFactory();

describe('buildQueryRootedInTemplate()', () => {
  it('should return query traversing from the entities of the template of the property to the configured pathes', () => {
    const property = fixtureFactory.v2.application.relationshipProperty('prop1', 'template1', [
      new TraversalQueryNode('out', {}, [new MatchQueryNode()]),
    ]);

    expect(property.buildQueryRootedInTemplate()).toEqual(
      new MatchQueryNode({ templates: [fixtureFactory.id('template1').toString()] }, property.query)
    );
  });
});

describe('queryUsesTemplate', () => {
  const property = fixtureFactory.v2.application.relationshipProperty('prop1', 'template1', [
    new TraversalQueryNode('out', {}, [
      new MatchQueryNode(
        {
          templates: ['template2'],
        },
        [
          new TraversalQueryNode('out', {}, [new MatchQueryNode()]),
          new TraversalQueryNode('in', {}, [new MatchQueryNode()]),
        ]
      ),
    ]),
    new TraversalQueryNode('in', {}, [new MatchQueryNode({ templates: ['template3'] })]),
  ]);

  it('should return true if the query is using the template', () => {
    expect(property.queryUsesTemplate('template2')).toBe(true);
  });

  it('should return false if the query is not using the template', () => {
    expect(property.queryUsesTemplate('template1')).toBe(false);
  });
});

describe('queryUsesRelationType', () => {
  const property = fixtureFactory.v2.application.relationshipProperty('prop1', 'template1', [
    new TraversalQueryNode('out', { types: ['relType2'] }, [
      new MatchQueryNode({}, [
        new TraversalQueryNode('out', { types: ['relType1'] }, [new MatchQueryNode()]),
        new TraversalQueryNode('in', {}, [new MatchQueryNode()]),
      ]),
    ]),
    new TraversalQueryNode('in', {}, [new MatchQueryNode()]),
  ]);

  it('should return true if the query is using the template', () => {
    expect(property.queryUsesRelationType('relType1')).toBe(true);
  });

  it('should return false if the query is not using the template', () => {
    expect(property.queryUsesRelationType('relType3')).toBe(false);
  });
});
