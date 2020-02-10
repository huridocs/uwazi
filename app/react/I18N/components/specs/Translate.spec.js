import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { Translate, mapStateToProps } from '../Translate';

describe('Translate', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      translationKey: 'Search',
      text: 'Buscar',
      edit: jasmine.createSpy('edit'),
    };
  });

  const render = () => {
    component = shallow(<Translate {...props}>Search</Translate>);
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
      Translate.translation = 'some catched translation';
      Translate.resetCachedTranslation();
      expect(Translate.translation).toBe(null);
    });
  });

  describe('mapStateToProps', () => {
    let translations;
    beforeEach(() => {
      translations = [
        { locale: 'en', contexts: [{ id: 'System', values: { Search: 'Search' } }] },
        { locale: 'es', contexts: [{ id: 'System', values: { Search: 'Buscar' } }] },
      ];
    });

    it('should try to translate the children and pass it on text', () => {
      props = { children: 'Search', context: 'System' };
      const state = {
        locale: 'es',
        inlineEdit: Immutable.fromJS({ inlineEdit: true }),
        translations: Immutable.fromJS(translations),
      };
      expect(mapStateToProps(state, props).text).toBe('Buscar');
      expect(mapStateToProps(state, props).i18nmode).toBe(true);
    });

    it('should allow overriding translation key', () => {
      props = { children: 'Test', translationKey: 'Search', context: 'System' };
      const state = {
        locale: 'es',
        inlineEdit: Immutable.fromJS({ inlineEdit: true }),
        translations: Immutable.fromJS(translations),
      };
      expect(mapStateToProps(state, props).text).toBe('Buscar');
      expect(mapStateToProps(state, props).i18nmode).toBe(true);
    });

    it('should store the current locale translation to be fast', () => {
      props = { children: 'Search', context: 'System' };
      const state = {
        locale: 'es',
        inlineEdit: Immutable.fromJS({ inlineEdit: true }),
        translations: Immutable.fromJS(translations),
      };
      mapStateToProps(state, props);
      expect(Translate.translation.locale).toBe('es');
      state.locale = 'en';
      mapStateToProps(state, props);
      expect(Translate.translation.locale).toBe('en');
    });
  });
});
