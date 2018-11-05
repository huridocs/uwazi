import Immutable from 'immutable';
import React from 'react';

import { shallow } from 'enzyme';
import { I18NApi } from 'app/I18N';
import { Languages } from '../Languages';

describe('Languages', () => {
  let component;
  const currentLanguages = [
    { label: 'Español', key: 'es', default: true },
    { label: 'English', key: 'en' }
  ];

  beforeEach(() => {
    component = shallow(
      <Languages
        languages={Immutable.fromJS(currentLanguages)}
      />
    );
  });

  it('should render Languages component', () => {
    expect(component).toMatchSnapshot();
  });

  describe('clicking on Set as default', () => {
    beforeEach(() => {
      spyOn(I18NApi, 'setDefaultLanguage').and.returnValue(Promise.resolve('ok'));
    });

    it('should call setDefaultLanguage', (done) => {

    });
  });
});
