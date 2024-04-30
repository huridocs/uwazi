/* eslint-disable react/no-multi-comp */
/* eslint-disable comma-spacing */
/* eslint-disable max-lines */
import React, { Component } from 'react';
import { DropTarget } from 'react-dnd-old';
import { List } from 'immutable';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as formActions, Control, Field } from 'react-redux-form';
import { useSetAtom } from 'jotai';
import { Icon } from 'UI';
import { withContext } from 'app/componentWrappers';
import { FormGroup } from 'app/Forms';
import ColorPicker from 'app/Forms/components/ColorPicker';
import { I18NLink, t, Translate } from 'app/I18N';
import { notificationActions } from 'app/Notifications';
import { notify } from 'app/Notifications/actions/notificationsActions';
import { templatesAtom } from 'app/V2/atoms';
import api from 'app/Templates/TemplatesAPI';
import {
  addProperty,
  inserted,
  saveTemplate,
  countByTemplate,
} from 'app/Templates/actions/templateActions';
import MetadataProperty from 'app/Templates/components/MetadataProperty';
import RemovePropertyConfirm from 'app/Templates/components/RemovePropertyConfirm';
import { AddThesaurusButton } from 'app/Thesauri/components/AddThesaurusButton';
import { AddRelationshipTypeButton } from 'app/RelationTypes/components/AddRelationshipTypeButton';
import { COLORS } from 'app/utils/colors';
import { ClientPropertySchema } from 'app/istore';
import { TemplateSchema } from 'shared/types/templateType';
import { PropertySchema } from 'shared/types/commonTypes';
import { Form } from 'app/Forms/Form';
import { TemplateAsPageControl } from './TemplateAsPageControl';
import { validate } from './ValidateTemplate';

interface MetadataTemplateProps {
  notify(message: any, type: any): any;
  saveTemplate(data: any): any;
  backUrl?: any;
  commonProperties?: any;
  connectDropTarget?: any;
  defaultColor: any;
  properties: PropertySchema[];
  environment: string;
  relationType?: any;
  savingTemplate: boolean;
  templates?: any;
  entityViewPage?: string;
  syncedTemplate?: boolean;
  _id?: string;
  mainContext: { confirm: Function };
  updateTemplatesAtom: Function;
}

const getTemplateDefaultColor = (allTemplates: List<TemplateSchema>, template: any) =>
  template.data.color ? template.data.color : COLORS[allTemplates.size % COLORS.length];

class MetadataTemplate extends Component<MetadataTemplateProps> {
  static propTypes: any;

  static defaultProps: MetadataTemplateProps = {
    notify,
    /* eslint-disable react/default-props-match-prop-types */
    saveTemplate,
    environment: 'template',
    /* eslint-enable react/default-props-match-prop-types */
    savingTemplate: false,
    defaultColor: null,
    properties: [],
    mainContext: { confirm: (_props: {}) => {} },
    updateTemplatesAtom: (_templates: any) => {},
  };

  confirmation = {
    templateConflict: {
      title: 'Template conflict',
      key: 'Mapping conflict error',
      text: `A reindex of your collection is necessary. The reason may vary
       -- from certain changes made to a template's property to new fields
       that need to be populated across entities.
       This process will not negatively affect the data in your collection.
       It can last a few minutes and some parts of your collection might take
       some time to reappear in the Library, but this is temporary. Do you want to continue?`,
    },
    largeNumberOfEntities: {
      title: 'Lengthy reindex process',
      key: 'Template with a long number of entities',
      text: `The template has changed and the associated entities will be re-indexed,
      this process may take several minutes, do you want to continue?`,
    },
  };

  constructor(props: MetadataTemplateProps) {
    super(props);
    this.onSubmit = this.onSubmit.bind(this);
    this.onSubmitFailed = this.onSubmitFailed.bind(this);
  }

  onSubmit = async (_template: TemplateSchema) => {
    const template = { ..._template };
    if (this.props.environment === 'relationType') {
      template.commonProperties = undefined;
    }
    template.properties = template.properties?.map(_prop => {
      const prop = { ..._prop };
      prop.label = _prop.label.trim();
      return prop;
    });
    if (template._id) {
      const entitiesCountOfTemplate = await countByTemplate(template);
      const lengthyReindexFloorCount = 30000;
      if (entitiesCountOfTemplate >= lengthyReindexFloorCount) {
        return this.confirmAndSaveTemplate(template, 'largeNumberOfEntities');
      }
    }
    try {
      await this.props.saveTemplate(template);
      const templates = await api.get('templates');
      console.log('templates', templates);
      this.props.updateTemplatesAtom(templates);
    } catch (e) {
      if (e.status === 409) return this.confirmAndSaveTemplate(template, 'templateConflict');
    }
  };

  onSubmitFailed() {
    this.props.notify(t('System', 'The template contains errors', null, false), 'danger');
  }

  confirmAndSaveTemplate(
    template: TemplateSchema,
    confirmationKey: 'templateConflict' | 'largeNumberOfEntities'
  ) {
    return this.props.mainContext.confirm({
      accept: () => {
        try {
          this.props.saveTemplate({ ...template, reindex: confirmationKey === 'templateConflict' });
        } catch (e) {
          if (e.status === 409) return this.confirmAndSaveTemplate(template, 'templateConflict');
        }
      },

      cancel: () => {},
      title: this.confirmation[confirmationKey].title,
      messageKey: this.confirmation[confirmationKey].key,
      message: this.confirmation[confirmationKey].text,
      type: 'success',
      acceptLabel: 'Confirm',
      zIndex: 99,
    });
  }

  render() {
    const { connectDropTarget, defaultColor, environment, syncedTemplate } = this.props;
    const commonProperties = this.props.commonProperties || [];
    return (
      <div>
        <RemovePropertyConfirm />
        <Form
          model="template.data"
          onSubmit={this.onSubmit}
          onSubmitFailed={this.onSubmitFailed}
          className="metadataTemplate"
          validators={validate(
            this.props.properties,
            commonProperties,
            this.props.templates.toJS(),
            this.props._id
          )}
        >
          {environment === 'template' && syncedTemplate && (
            <div className="metadataTemplate-sync">
              <Icon icon="exclamation-triangle" /> &nbsp;
              <Translate translationKey="syncedTemplateEditorMessage">
                This template is synced from another instance. Only entity view page can be enabled.
              </Translate>
            </div>
          )}

          <div className="metadataTemplate-heading">
            <FormGroup model=".name">
              <Field model=".name">
                <input
                  placeholder={t('System', 'Template name', null, false)}
                  className="form-control"
                  disabled={syncedTemplate}
                />
              </Field>
            </FormGroup>
            {defaultColor && !(environment === 'relationType') && (
              <Control
                model=".color"
                component={ColorPicker}
                defaultValue={defaultColor}
                mapProps={{
                  defaultValue: (props: any) => props.defaultValue,
                }}
                disabled={syncedTemplate}
              />
            )}
          </div>

          {environment === 'template' && (
            <>
              <div className="metadataTemplate-pageview">
                <FormGroup model=".entityViewPage">
                  <TemplateAsPageControl selectedPage={this.props.entityViewPage || ''} />
                </FormGroup>
              </div>
              {connectDropTarget(
                <ul className="metadataTemplate-list list-group">
                  {commonProperties.map((property: ClientPropertySchema, index: number) => (
                    <MetadataProperty
                      {...property}
                      key={property.localID}
                      localID={property.localID}
                      index={index - commonProperties.length}
                      syncedTemplate={syncedTemplate}
                    />
                  ))}
                  {this.props.properties.map((property: ClientPropertySchema, index: number) => (
                    <MetadataProperty
                      _id={property._id}
                      type={property.type}
                      inserting={property.inserting}
                      key={property.localID}
                      localID={property.localID}
                      index={index}
                      syncedTemplate={syncedTemplate}
                      // relationships v2
                      query={property.query}
                      denormalizedProperty={property.denormalizedProperty}
                    />
                  ))}
                  {!syncedTemplate && (
                    <div className="no-properties">
                      <span className="no-properties-wrap">
                        <Icon icon="clone" />
                        <Translate>Drag properties here</Translate>
                      </span>
                    </div>
                  )}
                </ul>
              )}
            </>
          )}

          <div className="settings-footer remove-extra-nesting">
            <div className="btn-cluster">
              <I18NLink to={this.props.backUrl} className="btn btn-default btn-plain">
                <Icon icon="arrow-left" directionAware />
                <span className="btn-label">
                  <Translate>Back</Translate>
                </span>
              </I18NLink>
            </div>
            {environment === 'template' && (
              <div className="btn-cluster lg-margin-left-12 sm-order-1 sm-footer-extra-row">
                <AddThesaurusButton />
                <AddRelationshipTypeButton />
              </div>
            )}
            <div className="btn-cluster content-right">
              <I18NLink to={this.props.backUrl} className="btn btn-default btn-extra-padding">
                <span className="btn-label">
                  <Translate>Cancel</Translate>
                </span>
              </I18NLink>
              <button
                type="submit"
                className="btn btn-success save-template btn-extra-padding"
                disabled={!!this.props.savingTemplate}
              >
                <span className="btn-label">
                  <Translate>Save</Translate>
                </span>
              </button>
            </div>
          </div>
        </Form>
      </div>
    );
  }
}

/* eslint-disable react/forbid-prop-types, react/require-default-props */
MetadataTemplate.propTypes = {
  connectDropTarget: PropTypes.func.isRequired,
  backUrl: PropTypes.string,
  _id: PropTypes.string,
  saveTemplate: PropTypes.func.isRequired,
  savingTemplate: PropTypes.bool,
  relationType: PropTypes.bool,
  setErrors: PropTypes.func,
  notify: PropTypes.func,
  properties: PropTypes.array,
  commonProperties: PropTypes.array,
  templates: PropTypes.object,
  defaultColor: PropTypes.string,
  entityViewPage: PropTypes.string,
  environment: PropTypes.string.isRequired,
  updateTemplatesAtom: PropTypes.func.isRequired,
};
/* eslint-enable react/forbid-prop-types, react/require-default-props */

const target = {
  canDrop() {
    return true;
  },

  drop(props: any, monitor: any): any {
    const item = monitor.getItem();

    const propertyAlreadyAdded = props.properties[item.index];

    if (propertyAlreadyAdded) {
      props.inserted(item.index);
      return {};
    }

    props.addProperty({ label: item.label, type: item.type }, props.properties.length);
    return { name: 'container' };
  },
};

const withTemplatesAtom =
  <T,>(Comp: React.ComponentClass<T, any>) =>
  (props: T) => {
    const updateTemplatesAtom = useSetAtom(templatesAtom);
    return <Comp {...props} updateTemplatesAtom={updateTemplatesAtom} />;
  };

const dropTarget = DropTarget('METADATA_OPTION', target, (connector: any) => ({
  connectDropTarget: connector.dropTarget(),
}))(withTemplatesAtom(MetadataTemplate));

const mapStateToProps = (
  {
    template,
    templates,
    relationTypes,
  }: {
    template: {
      data: {
        _id: string;
        commonProperties: any;
        properties: any;
        entityViewPage: string;
        synced?: boolean;
      };
      uiState: any;
    };
    templates: any;
    relationTypes: any;
  },

  props: { relationType?: any }
) => {
  const environment = props.relationType ? 'relationType' : 'template';
  const _templates = environment === 'relationType' ? relationTypes : templates;
  return {
    _id: template.data._id,
    commonProperties: template.data.commonProperties,
    properties: template.data.properties,
    entityViewPage: template.data.entityViewPage,
    syncedTemplate: template.data.synced,
    templates: _templates,
    savingTemplate: template.uiState.get('savingTemplate'),
    defaultColor: getTemplateDefaultColor(templates, template),
    environment,
  };
};

function mapDispatchToProps(dispatch: any) {
  return bindActionCreators(
    { inserted, addProperty, setErrors: formActions.setErrors, notify: notificationActions.notify },
    dispatch
  );
}

export { dropTarget, MetadataTemplate, mapStateToProps };

export default connect(mapStateToProps, mapDispatchToProps, null, { withRef: true })(
  withContext(dropTarget)
);
