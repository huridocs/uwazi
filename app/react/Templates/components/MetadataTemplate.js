import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { DropTarget } from 'react-dnd';
import { I18NLink } from 'app/I18N';
import { actions as formActions, Field, Form } from 'react-redux-form';
import { FormGroup } from 'app/Forms';
import ShowIf from 'app/App/ShowIf';

import { inserted, addProperty } from 'app/Templates/actions/templateActions';
import MetadataProperty from 'app/Templates/components/MetadataProperty';
import RemovePropertyConfirm from 'app/Templates/components/RemovePropertyConfirm';
import validator from './ValidateTemplate';

export class MetadataTemplate extends Component {
  constructor(props) {
    super(props);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onSubmit(_template) {
    const template = Object.assign({}, _template);
    template.properties = template.properties.map((_prop) => {
      const prop = Object.assign({}, _prop);
      prop.label = _prop.label.trim();
      return prop;
    });

    this.props.saveTemplate(template);
  }

  render() {
    const { connectDropTarget } = this.props;
    const commonProperties = this.props.commonProperties || [];

    return (
      <div>
        <RemovePropertyConfirm />
        <Form
          model="template.data"
          onSubmit={this.onSubmit}
          className="metadataTemplate"
          validators={validator(this.props.properties, this.props.templates.toJS(), this.props._id)}
        >
          <div className="metadataTemplate-heading">
            <FormGroup model=".name">
              <Field model=".name">
                <input placeholder="Template name" className="form-control"/>
              </Field>
            </FormGroup>
          </div>

          <ShowIf if={!this.props.relationType}>
            {connectDropTarget(
              <ul className="metadataTemplate-list list-group">
                {commonProperties.map((config, index) => {
                  const localID = config.localID || config._id;
                  return <MetadataProperty {...config} key={localID} localID={localID} index={index - this.props.commonProperties.length} />;
                })}
                {this.props.properties.map((config, index) => {
                  const localID = config.localID || config._id;
                  return <MetadataProperty {...config} key={localID} localID={localID} index={index}/>;
                })}
                <div className="no-properties">
                  <span className="no-properties-wrap"><i className="fa fa-clone" />Drag properties here</span>
                </div>
              </ul>
            )}
          </ShowIf>
          <div className="settings-footer">
            <I18NLink to={this.props.backUrl} className="btn btn-default">
              <i className="fa fa-arrow-left" />
              <span className="btn-label">Back</span>
            </I18NLink>
            <button type="submit" className="btn btn-success save-template" disabled={!!this.props.savingTemplate}>
              <i className="far fa-save"/>
              <span className="btn-label">Save</span>
            </button>
          </div>
        </Form>
      </div>
    );
  }
}

MetadataTemplate.defaultProps = {
  savingTemplate: false
};

MetadataTemplate.propTypes = {
  connectDropTarget: PropTypes.func.isRequired,
  formState: PropTypes.object,
  backUrl: PropTypes.string,
  _id: PropTypes.string,
  saveTemplate: PropTypes.func.isRequired,
  savingTemplate: PropTypes.bool,
  relationType: PropTypes.bool,
  setErrors: PropTypes.func,
  properties: PropTypes.array,
  commonProperties: PropTypes.array,
  templates: PropTypes.object
};

const target = {
  canDrop() {
    return true;
  },

  drop(props, monitor) {
    const item = monitor.getItem();

    const propertyAlreadyAdded = props.properties[item.index];

    if (propertyAlreadyAdded) {
      props.inserted(item.index);
      return;
    }

    props.addProperty({ label: item.label, type: item.type }, props.properties.length);
    return { name: 'container' };
  }
};

const dropTarget = DropTarget('METADATA_OPTION', target, connector => ({
  connectDropTarget: connector.dropTarget()
}))(MetadataTemplate);

export { dropTarget };

const mapStateToProps = ({ template, templates }) => ({
    _id: template.data._id,
    commonProperties: template.data.commonProperties,
    properties: template.data.properties,
    templates,
    savingTemplate: template.uiState.get('savingTemplate')
});

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ inserted, addProperty, setErrors: formActions.setErrors }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps, null, { withRef: true })(dropTarget);
