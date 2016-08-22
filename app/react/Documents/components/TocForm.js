import React, {Component, PropTypes} from 'react';
import {Form} from 'react-redux-form';

import {FormField} from 'app/Forms';

export class TocForm extends Component {
  render() {
    return (
      <Form className="toc" id='tocForm' model={this.props.model} onSubmit={this.props.onSubmit} >
        {this.props.toc.map((tocElement, index) => {
          return (
            <div className={`toc-indent-${tocElement.indentation}`} key={index}>
              <div className="toc-edit">
                <a onClick={this.props.indent.bind(null, tocElement, tocElement.indentation - 1)} className="toc-indent-less btn btn-xs btn-default">
                  <i className="fa fa-arrow-left"></i>
                </a>
                <a onClick={this.props.indent.bind(null, tocElement, tocElement.indentation + 1)} className="toc-indent-more btn btn-xs btn-default">
                  <i className="fa fa-arrow-right"></i>
                </a>
                <FormField model={`${this.props.model}[${index}].label`} >
                  <input className="form-control"/>
                </FormField>
                <a onClick={this.props.removeEntry.bind(this, tocElement)} className="btn btn-xs btn-danger">
                  <i className="fa fa-trash"></i>
                </a>
              </div>
            </div>
            );
        })}
      </Form>
    );
  }
}

TocForm.propTypes = {
  toc: PropTypes.array,
  model: PropTypes.string.isRequired,
  state: PropTypes.object,
  removeEntry: PropTypes.func,
  indent: PropTypes.func,
  onSubmit: PropTypes.func
};

export default TocForm;
