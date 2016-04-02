import React, {PropTypes} from 'react';
import {DragDropContext} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import Immutable from 'immutable';

import api from '~/Templates/TemplatesAPI';
import {setTemplate, saveTemplate} from '~/Templates/actions/templateActions';
import PropertyOption from '~/Templates/components/PropertyOption';
import MetadataTemplate from '~/Templates/components/MetadataTemplate';
import RouteHandler from '~/controllers/App/RouteHandler';
import './scss/templates.scss';

export class EditTemplate extends RouteHandler {

  static requestState({templateId}) {
    return api.get(templateId)
    .then((templates) => {
      let template = templates[0];
      template.properties = template.properties.map((property) => {
        property.id = Math.random().toString(36).substr(2);
        return property;
      });
      return {template: {data: Immutable.fromJS(template)}};
    });
  }

  setReduxState({template}) {
    this.props.setTemplate(template.data);
  }

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

//when all components are integrated with redux we can remove this
EditTemplate.__redux = true;

EditTemplate.propTypes = {
  saveTemplate: PropTypes.func,
  template: PropTypes.object
};

const mapStateToProps = (state) => {
  return {template: state.template.data.toJS()};
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({setTemplate, saveTemplate}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DragDropContext(HTML5Backend)(EditTemplate));
