"use strict";var _typeParsers = _interopRequireDefault(require("../../typeParsers"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('geolocation parser', () => {
  it('should build a geolocation type object', async () => {
    const templateProp = { name: 'geolocation_prop' };
    const rawEntity = { geolocation_prop: '1.5|45.65' };

    expect((await _typeParsers.default.geolocation(rawEntity, templateProp))).
    toEqual([{ lat: '1.5', lon: '45.65' }]);
  });

  it('should work on 0 values', async () => {
    const templateProp = { name: 'geolocation_prop' };
    const rawEntity = { geolocation_prop: '0|0' };

    expect((await _typeParsers.default.geolocation(rawEntity, templateProp))).
    toEqual([{ lat: '0', lon: '0' }]);
  });

  describe('when there is only one value', () => {
    it('should return null', async () => {
      const templateProp = { name: 'geolocation_prop' };
      const rawEntity = { geolocation_prop: 'oneValue' };

      expect((await _typeParsers.default.geolocation(rawEntity, templateProp))).
      toEqual(null);
    });
  });
});