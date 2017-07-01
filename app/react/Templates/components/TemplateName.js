import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {t} from 'app/I18N';
import ShowIf from 'app/App/ShowIf';
import {FormGroup} from 'app/Forms';
import {Field} from 'react-redux-form';

export class TemplateName extends Component {

  render() {
    const {valid, submitFailed, pristine, duplicated} = this.props;
    let nameGroupClass = 'template-name form-group';
    if (!valid && (submitFailed || !pristine)) {
      nameGroupClass += ' has-error';
    }

    return (
        <FormGroup model="template.data.name">
          <Field model="template.data.name">
            <input placeholder="Template name" className="form-control"/>
          </Field>
          <ShowIf if={!pristine && duplicated}>
            <div className="validation-error">
              <i className="fa fa-exclamation-triangle"></i>&nbsp;{t('System', 'Duplicated name')}
            </div>
          </ShowIf>
        </FormGroup>
    );
  }
}

TemplateName.propTypes = {
  valid: PropTypes.boolean,
  submitFailed: PropTypes.boolean,
  pristine: PropTypes.boolean,
  duplicated: PropTypes.boolean
};

const mapStateToProps = ({template}) => {
  const nameState = template.formState.name || {valid: true, pristine: true, errors: {}};
  return {
    submitFailed: template.formState.$form.submitFailed,
    valid: nameState.valid,
    pristine: nameState.pristine,
    duplicated: nameState.errors.duplicated
  };
};

export default connect(mapStateToProps)(TemplateName);
