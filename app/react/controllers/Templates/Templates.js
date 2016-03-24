import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import reducer from '../../reducer.js';
import Field from '../../components/Form/fields/Field';

const mapStateToProps = (state) => {
  return reducer(state);
}

class Templates extends Component {

  static requestState() {
    return Promise.resolve({});
  }

  static emptyState() {
    return {};
  }

  static renderTools() {}

  addField() {

  }

  render() {
    return (
      <div>
        <h1>form creator !</h1>
        {this.props.fields.map((field, index) => {
          return <Field config={field} key={index} />
        })}

        <button onClick={this.addField.bind(this)}/>
      </div>
    );
  }
}

Templates.propTypes = {
}

export default connect(
  mapStateToProps
)(Templates);
