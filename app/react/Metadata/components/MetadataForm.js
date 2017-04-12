import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {Form, Field} from 'react-redux-form';

import validator from '../helpers/validator';
import {Select as SimpleSelect} from 'app/Forms';
import MetadataFormFields from './MetadataFormFields';
import {FormGroup, IconSelector} from 'app/ReactReduxForms';
import {createSelector} from 'reselect';
import t from 'app/I18N/t';

const selectTemplateOptions = createSelector(
  [s => s.templates, (s, isEntity) => isEntity],
  (templates, isEntity) => {
    return templates.filter(template => {
      if (isEntity) {
        return template.get('isEntity');
      }
      return !template.get('isEntity');
    })
    .map((tmpl) => {
      return {label: tmpl.get('name'), value: tmpl.get('_id')};
    });
  }
);

export class MetadataForm extends Component {

  // onSubmit(entity) {
  //   this.props.onSubmit(entity);
  // }

  // translateOptions(thesauri) {
  //   return thesauri.values.map((option) => {
  //     option.label = t(thesauri._id, option.label);
  //     return option;
  //   });
  // }

  // shouldComponentUpdate(nextProps) {
  //   const templateChanged = !this.props.metadata.template || this.props.metadata.template !== nextProps.metadata.template;
  //   const validityChanged = this.props.state.$form.valid !== nextProps.state.$form.valid;
  //   const touchedChanged = this.props.state.$form.touched !== nextProps.state.$form.touched;

  //   return templateChanged || validityChanged || touchedChanged;
  // }

  // componentWillReceiveProps(nextProps) {
  //   console.log('--------------------------');
  //   Object.keys(nextProps).forEach(key => {
  //     if (this.props[key] !== nextProps[key]) {
  //       console.log('K:', key, ', prop:', nextProps[key]);
  //     }
  //   });
  //   console.log('--------------------------');
  // }

  render() {
    const {state, model, template, templateOptions} = this.props;
    if (!template) {
      return <div />;
    }

    return (
      <Form id='metadataForm' model={model} onSubmit={this.props.onSubmit} validators={validator.generate(template.toJS())}>

        <FormGroup {...state.title}>
          <ul className="search__filter">
            <li><label>{t('System', 'Title')} <span className="required">*</span></label></li>
            <li className="wide">
              <Field model={'.title'}>
                <textarea className="form-control"/>
              </Field>
            </li>
          </ul>
        </FormGroup>

        <FormGroup>
          <ul className="search__filter">
            <li><label>{t('System', 'Type')} <span className="required">*</span></label></li>
            <li className="wide">
              <SimpleSelect
                className="form-control"
                value={template.get('_id')}
                options={templateOptions.toJS()}
                onChange={(e) => {
                  this.props.changeTemplate(model, e.target.value);
                }}
              >
              </SimpleSelect>
            </li>
          </ul>
        </FormGroup>

        <FormGroup>
          <ul className="search__filter">
            <li><label>{t('System', 'Icon')} / {t('System', 'Flag')}</label></li>
            <li className="wide">
              <IconSelector model={'.icon'}/>
            </li>
          </ul>
        </FormGroup>

        <MetadataFormFields thesauris={this.props.thesauris} state={state} template={template} />
      </Form>
    );
  }
}

MetadataForm.propTypes = {
  model: PropTypes.string.isRequired,
  state: PropTypes.object,
  template: PropTypes.object,
  templateOptions: PropTypes.object,
  thesauris: PropTypes.object,
  changeTemplate: PropTypes.func,
  onSubmit: PropTypes.func
};

export const mapStateToProps = (state, ownProps) => {
  return {
    template: state.templates.find(tmpl => tmpl.get('_id') === ownProps.templateId),
    templateOptions: selectTemplateOptions(state, ownProps.isEntity)
  };
};

export default connect(mapStateToProps)(MetadataForm);
