import React, { Component, PropTypes } from 'react'
import api from '../../utils/api'

class TemplatesController extends Component {

  static requestState(templateKey){
    return api.get('templates')
    .then((response) => {
      let templates = response.json.rows;

      return {
        templates:templates,
        template: templates.find(template => template.key == templateKey)
      };
    })
  }

  render = () => {
    return (
      <div>
      </div>
    )
  }

}

export default TemplatesController;
