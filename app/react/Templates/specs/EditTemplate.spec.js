import React from 'react';
import backend from 'fetch-mock';
import { shallow } from 'enzyme';
import configureStore from 'redux-mock-store';

import { APIURL } from 'app/config.js';
import { EditTemplateComponent } from 'app/Templates/EditTemplate';
import TemplateCreator from 'app/Templates/components/TemplateCreator';
import RouteHandler from 'app/App/RouteHandler';
import { mockID } from 'shared/uniqueID';
import { RequestParams } from 'app/utils/RequestParams';

const mockStoreCreator = configureStore([]);

describe('EditTemplate', () => {
  const templates = [
    {
      _id: 'abc1',
      properties: [{ label: 'label1' }, { label: 'label2' }],
      commonProperties: [{ label: 'existingProperty' }],
    },
    { _id: 'abc2', properties: [{ label: 'label3' }, { label: 'label4' }] },
    { _id: 'abc3', properties: [{ label: 'label3' }, { label: 'label4' }], commonProperties: [] },
  ];
  const thesauris = [{ label: '1' }, { label: '2' }];
  const relationTypes = [{ name: 'Friend' }, { name: 'Family' }];
  let component;
  let props;
  let context;

  beforeEach(() => {
    RouteHandler.renderedFromServer = true;
    context = {
      store: mockStoreCreator({
        template: { data: { _id: 'id' } },
      }),
    };

    spyOn(context.store, 'dispatch');
    component = shallow(<EditTemplateComponent {...props} />, { context });

    mockID();

    backend.restore();
    backend
      .get(`${APIURL}templates`, { body: JSON.stringify({ rows: templates }) })
      .get(`${APIURL}relationtypes`, { body: JSON.stringify({ rows: relationTypes }) })
      .get(`${APIURL}thesauris`, { body: JSON.stringify({ rows: thesauris }) });
  });

  afterEach(() => backend.restore());

  it('should render a TemplateCreator', () => {
    expect(component.find(TemplateCreator).length).toBe(1);
  });

  describe('static requestState()', () => {
    it('should request templates and thesauris, and return templates, thesauris and find the editing template', async () => {
      const request = new RequestParams({ templateId: 'abc2' });
      const actions = await EditTemplateComponent.requestState(request);
      expect(actions).toMatchSnapshot();
    });

    it('should prepare the template properties with unique ids', async () => {
      const request = new RequestParams({ templateId: 'abc2' });
      const actions = await EditTemplateComponent.requestState(request);
      const template = actions[0].value;
      expect(template.properties[0]).toEqual({ label: 'label3', localID: 'unique_id' });
    });

    it('should append new commonProperties if none exist (lazy migration)', async () => {
      const request = new RequestParams({ templateId: 'abc2' });
      const actions = await EditTemplateComponent.requestState(request);
      const template = actions[0].value;
      expect(template.commonProperties.length).toBe(3);
      expect(template.commonProperties[0].label).toBe('Title');
    });

    it('should append new commonProperties if empty', async () => {
      const request = new RequestParams({ templateId: 'abc3' });
      const actions = await EditTemplateComponent.requestState(request);
      const template = actions[0].value;
      expect(template.commonProperties.length).toBe(3);
      expect(template.commonProperties[0].label).toBe('Title');
    });

    it('should keep existing commonProperties if they already have values', async () => {
      const request = new RequestParams({ templateId: 'abc1' });
      const actions = await EditTemplateComponent.requestState(request);
      const template = actions[0].value;
      expect(template.commonProperties.length).toBe(1);
      expect(template.commonProperties[0].label).toBe('existingProperty');
    });
  });
});
