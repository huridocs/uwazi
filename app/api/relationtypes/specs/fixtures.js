import { getFixturesFactory } from 'api/utils/fixturesFactory';
import db from 'api/utils/testing_db';

const against = db.id();
const canNotBeDeleted = db.id();
const inRelProperty = db.id();

const fixturesFactory = getFixturesFactory();

export default {
  relationtypes: [
    { _id: against, name: 'Against', properties: [] },
    { _id: db.id(), name: 'Suports', properties: [] },
    { _id: canNotBeDeleted, name: 'Related', properties: [] },
    { _id: inRelProperty, name: 'Used in a property' },
  ],
  templates: [
    fixturesFactory.template('With rel prop', [
      fixturesFactory.relationshipProp('rel prop', 'some template', {
        relationType: inRelProperty,
      }),
    ]),
  ],
  connections: [
    { _id: db.id(), title: 'reference1', sourceDocument: 'source1', template: canNotBeDeleted },
  ],
};

export { against, canNotBeDeleted, inRelProperty };
