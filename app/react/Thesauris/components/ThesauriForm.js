import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {reduxForm} from 'redux-form';
import {Link} from 'react-router';

import {saveThesauri, resetThesauri} from 'app/Thesauris/actions/thesauriActions';

export class ThesauriForm extends Component {

  componentWillUnmount() {
    this.props.resetThesauri();
  }

  render() {
    const {fields} = this.props;

    return (
      <div className="row thesauri">
        <main className="col-sm-12">
          <div className="well thesauri">
            <div className="thesauri-buttons">
              <button onClick={() => this.props.saveThesauri(this.props.values)} className="btn btn-success save-template">
                <i className="fa fa-save"/> Save Thesauri
              </button>
              <Link to="/templates" className="btn btn-default">Cancel</Link>
            </div>
            <form className="">
              <div className="form-group thesauri-name">
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
  values: PropTypes.object
};

export function mapStateToProps(state) {
  let fields = ['name', 'values[].label', 'values[].id', '_id', '_rev'];
  return {
    fields: fields,
    initialValues: state.thesauri.toJS()
  };
}

function bindActions(dispatch) {
  return bindActionCreators({saveThesauri, resetThesauri}, dispatch);
}

let form = reduxForm({form: 'thesauri'}, mapStateToProps, bindActions)(ThesauriForm);

export default form;
