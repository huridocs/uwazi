import React, {Component, PropTypes} from 'react';
// import {bindActionCreators} from 'redux';
// import Field from '../../components/Form/fields/Field';
// import * as templatesActions from './templatesActions';
import {DragDropContext} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import FieldOption from './FieldOption';
import Template from './Template';
import './scss/templates.scss';

class Templates extends Component {

  static requestState() {
    return Promise.resolve({});
  }

  static emptyState() {
    return {};
  }

  static renderTools() {}

  createField() {
    let name = '' + Math.floor(Math.random() * (999999 - 999) + 999);
    this.props.addField({fieldType: 'input', name: name});
  }

  render() {
    return (
      <div className="row">
        <main className="col-sm-9">
          <Template />
        </main>
        <aside className="col-sm-3">
          Field Option
          <ul className="field-options">
            <li><FieldOption name='Text' /></li>
            <li><FieldOption name='Checkbox' /></li>
            <li><FieldOption name='Select' /></li>
            <li><FieldOption name='List' /></li>
            <li><FieldOption name='Date' /></li>
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
