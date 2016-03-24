import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Field from '../../components/Form/fields/Field';
import * as templatesActions from './templatesActions';

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
            <div key={index}>
              <Field config={field} />
              <button onClick={() => this.props.removeField(index)}>Borrame</button>
            </div>
          );
        })}

        <button onClick={() => this.props.addField({fieldType: 'input'})}>ADD FIELD</button>
      </div>
    );
  }
}

Templates.propTypes = {
  fields: PropTypes.array,
  addField: PropTypes.func,
  removeField: PropTypes.func
};

const mapStateToProps = (state) => {
  return {fields: state.get('fields').toJS()};
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators(templatesActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Templates);
