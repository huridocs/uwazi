"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));
var _Translate = require("../Translate");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Translate', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      translationKey: 'Search',
      text: 'Buscar',
      edit: jasmine.createSpy('edit') };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_Translate.Translate, props, "Search"));
  };

  describe('render', () => {
    beforeEach(render);
    it('should render the property text inside of a span', () => {
      expect(component.find('span').text()).toBe('Buscar');
    });

    describe('when i18nmode is true', () => {
      beforeEach(() => {
        props.i18nmode = true;
        render();
      });

      it('should render the span with class active', () => {
        expect(component.find('span').hasClass('active')).toBe(true);
      });

      describe('onClick', () => {
        let mockEvent;
        beforeEach(() => {
          mockEvent = jasmine.createSpyObj(['stopPropagation', 'preventDefault']);
        });

        it('should stop the event from going up', () => {
          component.simulate('click', mockEvent);
          expect(mockEvent.stopPropagation).toHaveBeenCalled();
          expect(mockEvent.preventDefault).toHaveBeenCalled();
        });

        it('should call edit with context and children', () => {
          component.simulate('click', mockEvent);
          expect(props.edit).toHaveBeenCalledWith('System', 'Search');
        });
      });
    });
  });

  describe('resetCachedTranslation', () => {
    it('should set null the current catched translation', () => {
      _Translate.Translate.translation = 'some catched translation';
      _Translate.Translate.resetCachedTranslation();
      expect(_Translate.Translate.translation).toBe(null);
    });
  });

  describe('mapStateToProps', () => {
    let translations;
    beforeEach(() => {
      translations = [
      { locale: 'en', contexts: [{ id: 'System', values: { Search: 'Search' } }] },
      { locale: 'es', contexts: [{ id: 'System', values: { Search: 'Buscar' } }] }];

    });

    it('should try to translate the children and pass it on text', () => {
      props = { children: 'Search', context: 'System' };
      const state = {
        locale: 'es',
        inlineEdit: _immutable.default.fromJS({ inlineEdit: true }),
        translations: _immutable.default.fromJS(translations) };

      expect((0, _Translate.mapStateToProps)(state, props).text).toBe('Buscar');
      expect((0, _Translate.mapStateToProps)(state, props).i18nmode).toBe(true);
    });

    it('should allow overriding translation key', () => {
      props = { children: 'Test', translationKey: 'Search', context: 'System' };
      const state = {
        locale: 'es',
        inlineEdit: _immutable.default.fromJS({ inlineEdit: true }),
        translations: _immutable.default.fromJS(translations) };

      expect((0, _Translate.mapStateToProps)(state, props).text).toBe('Buscar');
      expect((0, _Translate.mapStateToProps)(state, props).i18nmode).toBe(true);
    });

    it('should store the current locale translation to be fast', () => {
      props = { children: 'Search', context: 'System' };
      const state = {
        locale: 'es',
        inlineEdit: _immutable.default.fromJS({ inlineEdit: true }),
        translations: _immutable.default.fromJS(translations) };

      (0, _Translate.mapStateToProps)(state, props);
      expect(_Translate.Translate.translation.locale).toBe('es');
      state.locale = 'en';
      (0, _Translate.mapStateToProps)(state, props);
      expect(_Translate.Translate.translation.locale).toBe('en');
    });
  });
});