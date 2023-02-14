import React from 'react';
import { actions as formActions } from 'react-redux-form';
import { withRouter } from 'app/componentWrappers';
import templatesAPI from 'app/Templates/TemplatesAPI';
import thesauriAPI from 'app/Thesauri/ThesauriAPI';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import TemplateCreator from 'app/Templates/components/TemplateCreator';
import { actions } from 'app/BasicReducer';
import RouteHandler from 'app/App/RouteHandler';
import { OnTemplateLoaded } from './components/OnTemplateLoaded';
import { prepareTemplate } from './actions/templateActions';

class EditTemplateComponent extends RouteHandler {
  static async requestState(requestParams) {
    const { templateId } = requestParams.data;
    const [templates, thesauris, relationTypes] = await Promise.all([
      templatesAPI.get(requestParams.onlyHeaders()),
      thesauriAPI.get(requestParams.onlyHeaders()),
      relationTypesAPI.get(requestParams.onlyHeaders()),
    ]);

    const template = templates.find(tmpl => tmpl._id === templateId);

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
      <div className="settings-content sm-footer-extra-row">
        <OnTemplateLoaded>
          <TemplateCreator />
        </OnTemplateLoaded>
      </div>
    );
  }
}

const EditTemplate = withRouter(EditTemplateComponent);
export { EditTemplate, EditTemplateComponent };
