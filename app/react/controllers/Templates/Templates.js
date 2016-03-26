import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
// import Field from '../../components/Form/fields/Field';
import * as templatesActions from './templatesActions';
import {DragDropContext} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import FieldOption from './FieldOption';
import Template from './Template';

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
      <div>
        <h1>form creator !</h1>
        <div style={{overflow: 'hidden', clear: 'both'}}>
          <FieldOption name='Text' />
          <FieldOption name='Checkbox' />
          <FieldOption name='Select' />
          <FieldOption name='List' />
          <FieldOption name='Date' />
        </div>
        <div style={{overflow: 'hidden', clear: 'both'}}>
          <Template />
        </div>
        <button onClick={() => this.createField()}>ADD FIELD</button>
      </div>
    );
  }
}

Templates.propTypes = {
  addField: PropTypes.func,
  removeField: PropTypes.func
};

const mapStateToProps = (state) => {
  return {fields: state.fields.toJS()};
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators(templatesActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DragDropContext(HTML5Backend)(Templates));
