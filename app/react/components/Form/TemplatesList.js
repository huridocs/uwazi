import fetch from 'isomorphic-fetch'
import React, { Component, PropTypes } from 'react'

class TemplatesList extends Component {

  renderTemplates() {
    if (this.props.templates) {
      return (
        <ul>
          {this.props.templates.map(template => {
            return <li key={template.id}>{template.value.name}</li>;
          })}
        </ul>
      )
    } else {
      return (
        <p>Fetching...</p>
      );
    }
  }

  render() {
    return (
      <div>
        <h4>Users</h4>
        {this.renderTemplates()}
      </div>
    )
  }
}

export default TemplatesList;
