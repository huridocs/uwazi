"use strict";var _SettingsAPI = _interopRequireDefault(require("../../SettingsAPI"));

var _settingsActions = _interopRequireDefault(require("../settingsActions"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('saveSettings', () => {
  let dispatch;
  beforeEach(() => {
    spyOn(_SettingsAPI.default, 'save').and.returnValue(Promise.resolve());
    dispatch = jasmine.createSpy('dispatch');
  });

  it('should save the settings using the api', () => {
    (0, _settingsActions.default)({ customSettings: 'anything' })(dispatch);

    expect(_SettingsAPI.default.save).toHaveBeenCalledWith({ data: { customSettings: 'anything' }, headers: {} });
  });

  it('should call notify after saving settings', done => {
    (0, _settingsActions.default)({ customSettings: 'anything' })(dispatch).
    then(() => {
      expect(dispatch).toHaveBeenCalled();
      done();
    });
  });
});