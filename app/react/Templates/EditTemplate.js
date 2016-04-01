import React, {Component, PropTypes} from 'react';
import {DragDropContext} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import PropertyOption from '~/Templates/components/PropertyOption';
import MetadataTemplate from '~/Templates/components/MetadataTemplate';
import './scss/templates.scss';

class EditTemplate extends Component {

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
  addField: PropTypes.func,
  removeProperty: PropTypes.func
};

export default DragDropContext(HTML5Backend)(EditTemplate);
