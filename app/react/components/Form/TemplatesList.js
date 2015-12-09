import fetch from 'isomorphic-fetch'
import React, { Component, PropTypes } from 'react'
import { Link } from 'react-router'

class TemplatesList extends Component {

  renderTemplates = () => {
    if (this.props.templates) {
      return (
        <ul>
          {this.props.templates.map(template => {
            let template_url = '/template/edit/'+template.id;
            return <li key={template.id}><Link to={template_url}>{template.value.name}</Link></li>;
          })}
        </ul>
      )
    } else {
      return (
        <p>Fetching...</p>
      );
    }
  }

  loadTemplate = (template_id) => {
    // e.preventDefault();
    // return this.fetch('/api/login', {method:'POST',
    //              headers: {
    //                'Accept': 'application/json',
    //                'Content-Type': 'application/json'
    //              },
    //              credentials: 'same-origin',
    //              body: JSON.stringify(this.state.credentials)})
    //   .then((response) => {
    //     this.setState({error: response.status !== 200})
    //     events.emit('login');
    //   }
    // );
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
