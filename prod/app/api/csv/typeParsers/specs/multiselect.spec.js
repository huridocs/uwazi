"use strict";var _thesauris = _interopRequireDefault(require("../../../thesauris"));
var _testing_db = _interopRequireDefault(require("../../../utils/testing_db"));

var _fixtures = _interopRequireWildcard(require("../../specs/fixtures"));
var _typeParsers = _interopRequireDefault(require("../../typeParsers"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('multiselect', () => {
  let value1;
  let value2;
  let value3;
  let value4;
  let thesauri1;

  const templateProp = { name: 'multiselect_prop', content: _fixtures.thesauri1Id };

  afterAll(async () => _testing_db.default.disconnect());
  beforeAll(async () => {
    await _testing_db.default.clearAllAndLoad(_fixtures.default);
    value1 = await _typeParsers.default.multiselect(
    { multiselect_prop: 'value4' },
    templateProp);


    value2 = await _typeParsers.default.multiselect(
    { multiselect_prop: 'Value1|value3| value3' },
    templateProp);


    value3 = await _typeParsers.default.multiselect(
    { multiselect_prop: 'value1| value2 | Value3' },
    templateProp);


    value4 = await _typeParsers.default.multiselect(
    { multiselect_prop: 'value1|value2|VALUE4' },
    templateProp);


    await _typeParsers.default.multiselect(
    { multiselect_prop: '' },
    templateProp);


    await _typeParsers.default.multiselect(
    { multiselect_prop: '|' },
    templateProp);


    thesauri1 = await _thesauris.default.getById(_fixtures.thesauri1Id);
  });

  it('should create thesauri values and return an array of ids', async () => {
    expect(thesauri1.values[0].label).toBe(' value4 ');
    expect(thesauri1.values[1].label).toBe('Value1');
    expect(thesauri1.values[2].label).toBe('value3');
    expect(thesauri1.values[3].label).toBe('value2');

    expect(value1).toEqual([thesauri1.values[0].id]);
    expect(value2).toEqual([thesauri1.values[1].id, thesauri1.values[2].id]);
    expect(value3).toEqual([thesauri1.values[1].id, thesauri1.values[2].id, thesauri1.values[3].id]);
    expect(value4).toEqual([thesauri1.values[0].id, thesauri1.values[1].id, thesauri1.values[3].id]);
  });

  it('should not create blank values, or repeat values', async () => {
    expect(thesauri1.values.length).toBe(4);
  });
});