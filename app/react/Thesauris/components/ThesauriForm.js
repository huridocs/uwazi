import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {reduxForm} from 'redux-form';
import {Link} from 'react-router';
import 'app/Thesauris/scss/thesauris.scss';

import {saveThesauri, resetThesauri} from 'app/Thesauris/actions/thesauriActions';

export class ThesauriForm extends Component {

  componentWillUnmount() {
    this.props.resetThesauri();
  }

  render() {
    const {fields, handleSubmit, submitFailed} = this.props;

    return (
      <div className="row thesauri">
        <main className="col-sm-12">
          <div className="well thesauri">
            <form onSubmit={handleSubmit(this.props.saveThesauri)} >
              <div className="thesauri-buttons">
                <Link to="/metadata" className="btn btn-default"><i className="fa fa-arrow-left"></i> Back</Link>&nbsp;
                <button className="btn btn-success save-template">
                  <i className="fa fa-save"/> Save Thesauri
                </button>
              </div>
              <div className={'form-group thesauri-name' + (submitFailed && fields.name.invalid ? ' has-error' : '')}>
                <label htmlFor="thesauriName" className="control-label">Thesauri name</label>
                <input id="thesauriName" className="form-control" type="text" {...fields.name}/>
              </div>
              <div>Values</div>
              <div className="thesauri-values">
              {fields.values.map((value, index) => {
                return <div key={index} className="form-group">
                        <input className="form-control" type="text" {...value.label} />
                        <a className="btn btn-danger" onClick={() => fields.values.removeField(index)}>Delete</a>
                      </div>;
              })}
              </div>
            </form>
            <button onClick={() => fields.values.addField()} className="btn btn-success"><i className="fa fa-plus"></i>Add value</button>
          </div>
        </main>
      </div>
    );
  }
}

ThesauriForm.propTypes = {
  fields: PropTypes.object.isRequired,
  saveThesauri: PropTypes.func,
  resetThesauri: PropTypes.func,
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
  let fields = ['name', 'values[].label', 'values[].id', '_id', '_rev'];
  return {
    fields: fields,
    initialValues: state.thesauri.toJS(),
    validate,
    onSubmit: saveThesauri
  };
}

function bindActions(dispatch) {
  return bindActionCreators({saveThesauri, resetThesauri}, dispatch);
}

let form = reduxForm({form: 'thesauri'}, mapStateToProps, bindActions)(ThesauriForm);

export default form;
