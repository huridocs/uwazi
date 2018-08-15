import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Immutable from 'immutable';
import MarkdownViewer from 'app/Markdown';

export class ItemPreview extends Component {
  render() {
    const property = this.props.template.get('properties').find(p => p.get('preview'));
    if (!property) {
      return false;
    }
    const value = this.props.entity.metadata[property.get('name')];
    if (!value) {
      return false;
    }
    return (
      <div className="preview">
        <MarkdownViewer markdown={value}/>
      </div>
    );
  }
}

ItemPreview.propTypes = {
  entity: PropTypes.instanceOf(Object).isRequired,
  template: PropTypes.instanceOf(Immutable.Map).isRequired
};


export function mapStateToProps(state, props) {
  const template = state.templates.find(t => t.get('_id') === props.entity.template);
  return {
    template
  };
}

export default connect(mapStateToProps)(ItemPreview);
