import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Form, Field } from 'react-redux-form';
import { Icon, DirectionAwareIcon } from 'UI';

export class TocForm extends Component {
  render() {
    return (
      <Form className="toc" id="tocForm" model={this.props.model} onSubmit={this.props.onSubmit} >
        {this.props.toc.map((tocElement, index) => (
          <div className={`toc-indent-${tocElement.indentation}`} key={index}>
            <div className="toc-edit">
              <a onClick={this.props.indent.bind(null, tocElement, tocElement.indentation - 1)} className="toc-indent-less btn btn-default">
                <DirectionAwareIcon icon="arrow-left" />
              </a>
              <a onClick={this.props.indent.bind(null, tocElement, tocElement.indentation + 1)} className="toc-indent-more btn btn-default">
                <DirectionAwareIcon icon="arrow-right" />
              </a>
              <Field model={`${this.props.model}[${index}].label`} >
                <input className="form-control"/>
              </Field>
              <a onClick={this.props.removeEntry.bind(this, tocElement)} className="btn btn-danger">
                <Icon icon="trash-alt" />
              </a>
            </div>
          </div>
            ))}
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
