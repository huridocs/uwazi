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
