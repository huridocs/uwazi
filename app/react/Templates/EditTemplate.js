import React from 'react';
import { actions as formActions } from 'react-redux-form';

import templatesAPI from 'app/Templates/TemplatesAPI';
import thesauriAPI from 'app/Thesauri/ThesauriAPI';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import TemplateCreator from 'app/Templates/components/TemplateCreator';
import { actions } from 'app/BasicReducer';
import RouteHandler from 'app/App/RouteHandler';
import ID from 'shared/uniqueID';
import templateCommonProperties from './utils/templateCommonProperties';
import { OnTemplateLoaded } from './components/OnTemplateLoaded';

const prepareTemplate = template => {
  const commonPropertiesExists = template.commonProperties && template.commonProperties.length;

  return {
    ...template,
    properties: template.properties.map(p => ({ ...p, localID: ID() })),
    commonProperties: commonPropertiesExists
      ? template.commonProperties
      : templateCommonProperties.get(),
  };
};

export default class EditTemplate extends RouteHandler {
  static async requestState(requestParams) {
    const { templateId } = requestParams.data;
    const [templates, thesauris, relationTypes] = await Promise.all([
      templatesAPI.get(requestParams.onlyHeaders()),
      thesauriAPI.get(requestParams.onlyHeaders()),
      relationTypesAPI.get(requestParams.onlyHeaders()),
    ]);

    const template = Object.assign(
      {},
      templates.find(tmpl => tmpl._id === templateId)
    );

    return [
      formActions.load('template.data', prepareTemplate(template)),
      actions.set('thesauris', thesauris),
      actions.set('templates', templates),
      actions.set('relationTypes', relationTypes),
    ];
  }

  componentDidMount() {
    this.context.store.dispatch(formActions.reset('template.data'));
  }

  render() {
    return (
      <OnTemplateLoaded>
        <TemplateCreator />
      </OnTemplateLoaded>
    );
  }
}
