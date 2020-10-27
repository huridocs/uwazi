import { TemplateSchema } from 'shared/types/templateType';
import ShowIf from 'app/App/ShowIf';
import { FormGroup } from 'app/Forms';
import ColorPicker from 'app/Forms/components/ColorPicker';
import { I18NLink, t } from 'app/I18N';
import { notificationActions } from 'app/Notifications';
import { notify } from 'app/Notifications/actions/notificationsActions';
import {
  addProperty,
  inserted,
  saveTemplate,
  validateMapping,
} from 'app/Templates/actions/templateActions';
import MetadataProperty from 'app/Templates/components/MetadataProperty';
import RemovePropertyConfirm from 'app/Templates/components/RemovePropertyConfirm';
import { COLORS } from 'app/utils/colors';
import { List } from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { DropTarget } from 'react-dnd';
import { connect } from 'react-redux';
import { actions as formActions, Control, Field, Form } from 'react-redux-form';
import { bindActionCreators } from 'redux';
import { PropertySchema } from 'shared/types/commonTypes';
import { Icon } from 'UI';

import validator from './ValidateTemplate'; // eslint-disable-line import/no-named-as-default, import/no-named-as-default-member

interface MetadataTemplateProps {
  notify(message: any, type: any): any;
  saveTemplate(data: any): any;
  backUrl?: any;
  commonProperties?: any;
  connectDropTarget?: any;
  defaultColor: any;
  properties: PropertySchema[];
  relationType?: any;
  savingTemplate: boolean;
  templates?: any;
  _id?: string;
}

const getTemplateDefaultColor = (allTemplates: List<TemplateSchema>, template: any) => {
  return template.data.color ? template.data.color : COLORS[allTemplates.size % COLORS.length];
};

export class MetadataTemplate extends Component<MetadataTemplateProps> {
  static propTypes: any;

  static contextTypes = {
    confirm: PropTypes.func,
  };

  static defaultProps: MetadataTemplateProps = {
    notify,
    saveTemplate, // eslint-disable-line react/default-props-match-prop-types
    savingTemplate: false,
    defaultColor: null,
    properties: [],
  };

  constructor(props: MetadataTemplateProps) {
    super(props);
    this.onSubmit = this.onSubmit.bind(this);
    this.onSubmitFailed = this.onSubmitFailed.bind(this);
  }

  onSubmit = async (_template: TemplateSchema) => {
    const template = { ..._template };
    template.properties = template.properties?.map(_prop => {
      const prop = { ..._prop };
      prop.label = _prop.label.trim();
      return prop;
    });

    const mappingValidation = await validateMapping(template);
    if (!mappingValidation.valid) {
      const fields = mappingValidation.errors.map((e: any) => e.name);
      this.context.confirm({
        accept: () => {
          template.reindex = true;
          return this.props.saveTemplate(template);
        },
        title: 'Template conflict',
        message: `The field or fields [${fields}] has been previously used for a different type of data,
         in order to reuse those names, all your collection must be reindexed. This process may take several minutes, do you want to continue? `,
      });
      return;
    }

    this.props.saveTemplate(template);
  };

  onSubmitFailed() {
    this.props.notify(t('System', 'The template contains errors', null, false), 'danger');
  }

  render() {
    const { connectDropTarget, defaultColor } = this.props;
    const commonProperties = this.props.commonProperties || [];
    return (
      <div>
        <RemovePropertyConfirm />
        <Form
          model="template.data"
          onSubmit={this.onSubmit}
          onSubmitFailed={this.onSubmitFailed}
          className="metadataTemplate"
          validators={validator(
            this.props.properties,
            commonProperties,
            this.props.templates.toJS(),
            this.props._id
          )}
        >
          <div className="metadataTemplate-heading">
            <FormGroup model=".name">
              <Field model=".name">
                <input placeholder="Template name" className="form-control" />
              </Field>
            </FormGroup>
            {defaultColor && (
              <Control
                model=".color"
                component={ColorPicker}
                defaultValue={defaultColor}
                mapProps={{
                  defaultValue: (props: any) => props.defaultValue,
                }}
              />
            )}
          </div>

          <ShowIf if={!this.props.relationType}>
            {connectDropTarget(
              <ul className="metadataTemplate-list list-group">
                {commonProperties.map((config: any, index: number) => {
                  const localID = config.localID || config._id;
                  return (
                    <MetadataProperty
                      {...config}
                      key={localID}
                      localID={localID}
                      index={index - commonProperties.length}
                    />
                  );
                })}
                {this.props.properties.map((config: any, index: number) => {
                  const localID = config.localID || config._id;
                  return (
                    <MetadataProperty
                      _id={config._id}
                      type={config.type}
                      inserting={config.inserting}
                      key={localID}
                      localID={localID}
                      index={index}
                    />
                  );
                })}
                <div className="no-properties">
                  <span className="no-properties-wrap">
                    <Icon icon="clone" />
                    Drag properties here
                  </span>
                </div>
              </ul>
            )}
          </ShowIf>
          <div className="settings-footer">
            <I18NLink to={this.props.backUrl} className="btn btn-default">
              <Icon icon="arrow-left" directionAware />
              <span className="btn-label">Back</span>
            </I18NLink>
            <button
              type="submit"
              className="btn btn-success save-template"
              disabled={!!this.props.savingTemplate}
            >
              <Icon icon="save" />
              <span className="btn-label">Save</span>
            </button>
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

const dropTarget = DropTarget('METADATA_OPTION', target, (connector: any) => ({
  connectDropTarget: connector.dropTarget(),
}))(MetadataTemplate);

export { dropTarget };

export const mapStateToProps = (
  {
    template,
    templates,
    relationTypes,
  }: {
    template: { data: { _id: string; commonProperties: any; properties: any }; uiState: any };
    templates: any;
    relationTypes: any;
  },
  props: { relationType?: any }
) => {
  const _templates = props.relationType ? relationTypes : templates;
  return {
    _id: template.data._id,
    commonProperties: template.data.commonProperties,
    properties: template.data.properties,
    templates: _templates,
    savingTemplate: template.uiState.get('savingTemplate'),
    defaultColor: getTemplateDefaultColor(templates, template),
  };
};

function mapDispatchToProps(dispatch: any) {
  return bindActionCreators(
    { inserted, addProperty, setErrors: formActions.setErrors, notify: notificationActions.notify },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps, null, { withRef: true })(dropTarget);
