import React, {Component, PropTypes} from 'react';
import {createFieldClass, controls} from 'react-redux-form';

export class ViolatedArticles extends Component {

  onChange(e) {
    let value = e.target.value || '';
    this.props.onChange(value.split('\n'));
  }

  parseValue(value) {
    let val = value || [];
    return val.join('\n');
  }

  render() {
    return <textarea className="form-control" rows="6" onChange={this.onChange.bind(this)} value={this.parseValue(this.props.value)}/>;
  }

}

ViolatedArticles.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.array
};

export default ViolatedArticles;

const ViolatedArticlesField = createFieldClass({
  ViolatedArticles: controls.textarea
});

export {ViolatedArticlesField};
