import React from 'react';
import { shallow } from 'enzyme';

import thesaurisAPI from 'app/Thesauri/ThesaurisAPI';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import { RequestParams } from 'app/utils/RequestParams';

import NewTemplate from '../NewTemplate';
import templatesAPI from '../TemplatesAPI';
import TemplateCreator from '../components/TemplateCreator';

describe('NewTemplate', () => {
  let component;
  let context;
  const thesauris = [{ label: '1' }, { label: '2' }];
  const templates = [{ name: 'Comic' }, { name: 'Newspaper' }];
  const relationTypes = [{ name: 'Friend' }, { name: 'Family' }];

  beforeEach(() => {
    context = { store: { getState: () => ({}), dispatch: jasmine.createSpy('dispatch') } };
    spyOn(templatesAPI, 'get').and.returnValue(templates);
    spyOn(thesaurisAPI, 'get').and.returnValue(thesauris);
    spyOn(relationTypesAPI, 'get').and.returnValue(relationTypes);
    component = shallow(<NewTemplate />, { context });
  });

  it('should render a TemplateCreator', () => {
    expect(component.find(TemplateCreator).length).toBe(1);
  });

  describe('static requestState()', () => {
    it('should request the thesauris and templates to fit in the state', async () => {
      const request = new RequestParams({});
      const actions = await NewTemplate.requestState(request);

      expect(templatesAPI.get).toHaveBeenCalledWith(request.onlyHeaders());
      expect(thesaurisAPI.get).toHaveBeenCalledWith(request.onlyHeaders());
      expect(relationTypesAPI.get).toHaveBeenCalledWith(request.onlyHeaders());

      expect(actions).toMatchSnapshot();
    });
  });
});
