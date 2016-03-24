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
          return <Field config={field} key={index} />;
        })}

        <button onClick={this.props.addField}>ADD FIELD</button>
      </div>
    );
  }
}

Templates.propTypes = {
  fields: PropTypes.array,
  addField: PropTypes.func
};

const mapStateToProps = (state) => {
  return {fields: state.fields};
};

function mapDispatchToProps(dispatch) {
  return {addField: () => {
    dispatch({type: 'ADD_FIELD'});
  }};
}

export default connect(mapStateToProps, mapDispatchToProps)(Templates);
