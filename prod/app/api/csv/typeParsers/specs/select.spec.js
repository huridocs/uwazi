"use strict";var _thesauris = _interopRequireDefault(require("../../../thesauris"));
var _testing_db = _interopRequireDefault(require("../../../utils/testing_db"));

var _fixtures = _interopRequireWildcard(require("../../specs/fixtures"));
var _typeParsers = _interopRequireDefault(require("../../typeParsers"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('select', () => {
  beforeEach(async () => _testing_db.default.clearAllAndLoad(_fixtures.default));
  afterAll(async () => _testing_db.default.disconnect());

  it('should create thesauri value and return the id', async () => {
    const templateProp = { name: 'select_prop', content: _fixtures.thesauri1Id };

    const value1 = await _typeParsers.default.select({ select_prop: 'value' }, templateProp);
    const value2 = await _typeParsers.default.select({ select_prop: 'value2' }, templateProp);
    const thesauri1 = await _thesauris.default.getById(_fixtures.thesauri1Id);

    expect(thesauri1.values[1].label).toBe('value');
    expect(thesauri1.values[2].label).toBe('value2');
    expect(value1).toBe(thesauri1.values[1].id);
    expect(value2).toBe(thesauri1.values[2].id);
  });

  it('should not repeat case sensitive values', async () => {
    const templateProp = { name: 'select_prop', content: _fixtures.thesauri1Id };

    await _typeParsers.default.select({ select_prop: 'Value' }, templateProp);
    await _typeParsers.default.select({ select_prop: 'value ' }, templateProp);

    await _typeParsers.default.select({ select_prop: 'vAlue2' }, templateProp);
    await _typeParsers.default.select({ select_prop: 'vAlue2' }, templateProp);

    await _typeParsers.default.select({ select_prop: 'value4' }, templateProp);
    await _typeParsers.default.select({ select_prop: 'ValUe4' }, templateProp);

    const thesauri1 = await _thesauris.default.getById(_fixtures.thesauri1Id);

    expect(thesauri1.values.map(v => v.label)).toEqual([' value4 ', 'Value', 'vAlue2']);
  });

  it('should not create repeated values', async () => {
    const templateProp = { name: 'select_prop', content: _fixtures.thesauri1Id };

    await _typeParsers.default.select({ select_prop: 'value4' }, templateProp);
    await _typeParsers.default.select({ select_prop: 'value ' }, templateProp);
    await _typeParsers.default.select({ select_prop: 'value' }, templateProp);
    await _typeParsers.default.select({ select_prop: ' value ' }, templateProp);
    await _typeParsers.default.select({ select_prop: 'value4' }, templateProp);
    const thesauri1 = await _thesauris.default.getById(_fixtures.thesauri1Id);

    expect(thesauri1.values.length).toBe(2);
  });

  it('should not create blank values', async () => {
    const templateProp = { name: 'select_prop', content: _fixtures.thesauri1Id };
    const rawEntity = { select_prop: ' ' };

    const value = await _typeParsers.default.select(rawEntity, templateProp);
    const thesauri1 = await _thesauris.default.getById(_fixtures.thesauri1Id);

    expect(thesauri1.values.length).toBe(1);
    expect(value).toBe(null);
  });
});