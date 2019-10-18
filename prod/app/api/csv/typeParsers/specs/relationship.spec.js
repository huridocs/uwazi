"use strict";var _entities = _interopRequireWildcard(require("../../../entities"));
var _testing_db = _interopRequireDefault(require("../../../utils/testing_db"));

var _fixtures = _interopRequireWildcard(require("../../specs/fixtures"));
var _typeParsers = _interopRequireDefault(require("../../typeParsers"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}

describe('relationship', () => {
  let value1;
  let value2;
  let value3;
  let entitiesRelated;

  const templateProp = {
    name: 'relationship_prop',
    content: _fixtures.templateToRelateId };


  afterAll(async () => _testing_db.default.disconnect());

  beforeAll(async () => {
    await _testing_db.default.clearAllAndLoad(_fixtures.default);

    spyOn(_entities.default, 'indexEntities').and.returnValue(Promise.resolve());
    await _entities.model.save({ title: 'value1', template: _fixtures.templateToRelateId, sharedId: '123', language: 'en' });
    await _entities.model.save({ title: 'value1', template: _fixtures.templateToRelateId, sharedId: '123', language: 'es' });
    value1 = await _typeParsers.default.relationship(
    { relationship_prop: 'value1|value3|value3' },
    templateProp);


    value2 = await _typeParsers.default.relationship(
    { relationship_prop: 'value1|value2' },
    templateProp);


    value3 = await _typeParsers.default.relationship(
    { relationship_prop: 'value1|value2' },
    templateProp);


    await _typeParsers.default.relationship(
    { relationship_prop: '' },
    templateProp);


    await _typeParsers.default.relationship(
    { relationship_prop: '|' },
    templateProp);


    entitiesRelated = await _entities.default.get({ template: _fixtures.templateToRelateId, language: 'en' });
  });

  it('should create entities and return the ids', async () => {
    expect(entitiesRelated[0].title).toBe('value1');
    expect(entitiesRelated[1].title).toBe('value3');
    expect(entitiesRelated[2].title).toBe('value2');

    expect(value1).toEqual([entitiesRelated[0].sharedId, entitiesRelated[1].sharedId]);
    expect(value2).toEqual([entitiesRelated[0].sharedId, entitiesRelated[2].sharedId]);
    expect(value3).toEqual([entitiesRelated[0].sharedId, entitiesRelated[2].sharedId]);
  });

  it('should not create blank values or duplicate values', async () => {
    expect(entitiesRelated.length).toBe(3);
  });
});