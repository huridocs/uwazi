import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {reduxForm} from 'redux-form';
import {Link} from 'react-router';

import {saveRelationType, resetRelationType} from 'app/RelationTypes/actions/relationTypeActions';

export class RelationTypeForm extends Component {

  componentWillUnmount() {
    this.props.resetRelationType();
  }

  render() {
    const {fields, handleSubmit, submitFailed} = this.props;

    return (
      <div className="row relationType">
        <main className="col-sm-12">
          <div className="well relationType">
            <form onSubmit={handleSubmit(this.props.saveRelationType)} >
              <div className="relationType-buttons">
                <button className="btn btn-success save-template">
                  <i className="fa fa-save"/> Save Relation Type
                </button>
                <Link to="/metadata" className="btn btn-default">Cancel</Link>
              </div>
              <div className={'form-group relationType-name' + (submitFailed && fields.name.invalid ? ' has-error' : '')}>
                <label htmlFor="relationTypeName" className="control-label">Relation Type name</label>
                <input id="relationTypeName" className="form-control" type="text" {...fields.name}/>
              </div>
            </form>
          </div>
        </main>
      </div>
    );
  }
}

RelationTypeForm.propTypes = {
  fields: PropTypes.object.isRequired,
  saveRelationType: PropTypes.func,
  resetRelationType: PropTypes.func,
  values: PropTypes.object,
  handleSubmit: PropTypes.func,
  submitFailed: PropTypes.bool
};

const validate = (values) => {
  let errors = {};

  if (!values.name) {
    errors.name = 'Required';
  }

  return errors;
};

export function mapStateToProps(state) {
  let fields = ['name', '_id', '_rev'];
  return {
    fields: fields,
    initialValues: state.relationType.toJS(),
    validate,
    onSubmit: saveRelationType
  };
}

function bindActions(dispatch) {
  return bindActionCreators({saveRelationType, resetRelationType}, dispatch);
}

let form = reduxForm({form: 'relationType'}, mapStateToProps, bindActions)(RelationTypeForm);

export default form;
