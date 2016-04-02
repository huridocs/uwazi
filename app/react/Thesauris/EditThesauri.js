import React, {PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {Link} from 'react-router';

import RouteHandler from '~/controllers/App/RouteHandler';
import {addValue} from '~/Thesauris/actions/thesauriActions';

export class EditThesauri extends RouteHandler {

  static requestState() {
    return Promise.resolve({});
  }

  setReduxState() {}

  render() {
    return (
      <div className="row thesauri">
        <main className="col-sm-12">
          <div className="well template">
            <Link to="/templates" className="btn btn-default">Cancel</Link>
            <button onClick={() => this.props.saveTemplate(this.props.template)} className="btn btn-success save-template">
              <i className="fa fa-save"/> Save Thesauri
            </button>
            <h1>Thesauri name <span className="edit">(Edit name)</span></h1>
            {this.props.values.map((value, index) => {
              return <div key={index} className="form-group">
                      <label>{index}</label>
                      <input type="text" value={value.label} />
                    </div>;
            })}
            <button onClick={this.props.addValue} className="btn btn-success"><i className="fa fa-plus"></i>Add value</button>
          </div>
        </main>
      </div>
    );
  }
}

//when all components are integrated with redux we can remove this
EditThesauri.__redux = true;

EditThesauri.propTypes = {
  name: PropTypes.string,
  values: PropTypes.array,
  addValue: PropTypes.func
};

const mapStateToProps = (state) => {
  return {
    name: state.thesauri.toJS().name,
    values: state.thesauri.toJS().values
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({addValue}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(EditThesauri);
