import fetch from 'isomorphic-fetch'
import React, { Component, PropTypes } from 'react'
import { Link } from 'react-router'

class TemplatesList extends Component {

  renderTemplates = () => {
    if (this.props.templates) {
      return (
        <ul>
          {this.props.templates.map((template, index) => {
            let template_url = '/template/edit/'+template.id;
            return <li key={template.id}><Link to={template_url}>{template.value.name}</Link> <a href="#" onClick={this.delete.bind(this, template)}>Delete</a></li>;
          })}
        </ul>
      )
    } else {
      return (
        <p>Fetching...</p>
      );
    }
  }

  delete = (template, event) => {
    event.preventDefault();
    return fetch('/api/templates', {method:'DELETE',
                 headers: {
                   'Accept': 'application/json',
                   'Content-Type': 'application/json'
                 },
                 credentials: 'same-origin',
                 body: JSON.stringify(template.value)})
      .then((response) => { });
  }

  render = () => {
    return (
      <div>
        <h4>Users</h4>
        {this.renderTemplates()}
      </div>
    )
  }
}

export default TemplatesList;
