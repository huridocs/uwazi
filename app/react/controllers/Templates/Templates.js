import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import Field from '../../components/Form/fields/Field';

class Templates extends Component {

  static requestState() {
    return Promise.resolve({});
  }

  static emptyState() {
    return {};
  }

  static renderTools() {}

  render() {
    return (
      <div>
        <h1>form creator !</h1>
        {this.props.fields.map((field, index) => {
          return (
                  <div>
                    <Field config={field} key={index} />
                    <button onClick={this.props.deleteField.bind(null, index)}>Borrame</button>
                  </div>
                );
        })}

        <button onClick={this.props.addField}>ADD FIELD</button>
      </div>
    );
  }
}

Templates.propTypes = {
  fields: PropTypes.array,
  addField: PropTypes.func,
  deleteField: PropTypes.func
};

const mapStateToProps = (state) => {
  return {fields: state.get('fields').toJS()};
};

function mapDispatchToProps(dispatch) {
  return {
    addField: () => {
      dispatch({type: 'ADD_FIELD', fieldType: 'input'});
    },
    deleteField: (index) => {
      dispatch({type: 'DELETE_FIELD', index: index});
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Templates);
