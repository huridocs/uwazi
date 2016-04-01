import React, {PropTypes} from 'react';
import {DragDropContext} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import {saveTemplate} from '~/Templates/actions/templateActions';
import PropertyOption from '~/Templates/components/PropertyOption';
import MetadataTemplate from '~/Templates/components/MetadataTemplate';
import RouteHandler from '~/controllers/App/RouteHandler';
import './scss/templates.scss';

export class EditTemplate extends RouteHandler {

  static requestState() {
    return Promise.resolve({});
  }

  setReduxState() {}

  render() {
    return (
      <div className="row">
        <main className="col-sm-9">
          <div className="well template">
            <button className="btn btn-default">Cancel</button>
            <button onClick={() => this.props.saveTemplate(this.props.template)} className="btn btn-success save-template">
              <i className="fa fa-save"/> Save Template
            </button>
            <h1>Template name <span className="edit">(Edit name)</span></h1>
            <MetadataTemplate />
          </div>
        </main>
        <aside className="col-sm-3">
          <h1>Construction blocks</h1>
          <ul className="field-options">
            <li><PropertyOption label='Text' /></li>
            <li><PropertyOption label='Checkbox' /></li>
            <li><PropertyOption label='Select' /></li>
            <li><PropertyOption label='List' /></li>
            <li><PropertyOption label='Date' /></li>
          </ul>
        </aside>
      </div>
    );
  }
}

EditTemplate.propTypes = {
  saveTemplate: PropTypes.func,
  template: PropTypes.object
};

const mapStateToProps = (state) => {
  return {template: state.template.data.toJS()};
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({saveTemplate}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DragDropContext(HTML5Backend)(EditTemplate));
