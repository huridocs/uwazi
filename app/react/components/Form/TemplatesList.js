import request from '../../../shared/JSONRequest'
import React, { Component, PropTypes } from 'react'
import { Link } from 'react-router'

class TemplatesList extends Component {

  constructor (props) {
    super(props);
    this.state = {templates: props.templates};
  }

  componentDidUpdate = (prevProps) => {
    if(prevProps.templates !== this.props.templates){
      this.setState({templates:this.props.templates});
    }
  }

  renderTemplates = () => {
    if (this.state.templates) {
      return (
        <ul className="list-group">
          {this.state.templates.map((template, index) => {
            let className = "list-group-item";
            if(this.props.active && template.id == this.props.active._id){
              className = "list-group-item active";
            }
            let template_url = '/template/edit/'+template.id;
            return (
                <Link className={className} key={template.id} to={template_url}>
                <span className="glyphicon glyphicon-remove" onClick={this.delete.bind(this, template, index)}></span>
                 &nbsp;&nbsp;&nbsp;{template.value.name}
                </Link>
          );
          })}
        </ul>
      )
    } else {
      return (
        <p>Fetching...</p>
      );
    }
  }

  delete = (template, index, event) => {
    event.preventDefault();
    return request.delete('/api/templates', template.value)
    .then((response) => {
      this.state.templates.splice(index, 1);
      this.setState({templates: this.state.templates });
    });
  }

  render = () => {
    return (
      <div>
        <h4>Templates</h4>
        {this.renderTemplates()}
      </div>
    )
  }
}

export default TemplatesList;
