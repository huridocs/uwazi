import React from 'react';
import { shallow } from 'enzyme';

import thesauriAPI from 'app/Thesauri/ThesauriAPI';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import { RequestParams } from 'app/utils/RequestParams';

import NewTemplate from '../NewTemplate';
import TemplateCreator from '../components/TemplateCreator';

describe('NewTemplate', () => {
  let component;
  let context;
  const thesauri = [{ label: '1' }, { label: '2' }];
  const relationTypes = [{ name: 'Friend' }, { name: 'Family' }];

  beforeEach(() => {
    context = { store: { getState: () => ({}), dispatch: jasmine.createSpy('dispatch') } };
    spyOn(thesauriAPI, 'get').and.returnValue(thesauri);
    spyOn(relationTypesAPI, 'get').and.returnValue(relationTypes);
    component = shallow(<NewTemplate />, { context });
  });

  it('should render a TemplateCreator', () => {
    expect(component.find(TemplateCreator).length).toBe(1);
  });

  describe('static requestState()', () => {
    it('should request the thesauri and templates to fit in the state', async () => {
      const request = new RequestParams({});
      const actions = await NewTemplate.requestState(request);

      expect(thesauriAPI.get).toHaveBeenCalledWith(request.onlyHeaders());
      expect(relationTypesAPI.get).toHaveBeenCalledWith(request.onlyHeaders());

      expect(actions).toMatchSnapshot();
    });
  });
});
