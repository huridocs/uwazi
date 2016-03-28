import React, {Component, PropTypes} from 'react';
// import {bindActionCreators} from 'redux';
// import Field from '../../components/Form/fields/Field';
// import * as templatesActions from './templatesActions';
import {DragDropContext} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import PropertyOption from './PropertyOption';
import MetadataTemplate from './MetadataTemplate';
import './scss/templates.scss';

class Templates extends Component {

  static requestState() {
    return Promise.resolve({});
  }

  static emptyState() {
    return {};
  }

  render() {
    return (
      <div className="row">
        <main className="col-sm-9">
          <div className="well template">
            <button className="btn btn-default">Cancel</button>
            <button className="btn btn-success"><i className="fa fa-save"/> Save Template</button>
            <h1>Template name</h1>
            <MetadataTemplate />
          </div>
        </main>
        <aside className="col-sm-3">
          Field Option
          <ul className="field-options">
            <li><PropertyOption name='Text' /></li>
            <li><PropertyOption name='Checkbox' /></li>
            <li><PropertyOption name='Select' /></li>
            <li><PropertyOption name='List' /></li>
            <li><PropertyOption name='Date' /></li>
          </ul>
        </aside>
      </div>
    );
  }
}

Templates.propTypes = {
  addField: PropTypes.func,
  removeField: PropTypes.func
};

export default DragDropContext(HTML5Backend)(Templates);
