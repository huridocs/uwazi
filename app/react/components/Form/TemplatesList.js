import request from '../../../shared/JSONRequest';
import React, {Component, PropTypes} from 'react';
import {Link} from 'react-router';

class TemplatesList extends Component {

  constructor(props) {
    super(props);
    this.state = {templates: props.templates};
  }

  componentDidUpdate(prevProps) {
    if (prevProps.templates !== this.props.templates) {
      this.setState({templates: this.props.templates});
    }
  }

  renderTemplates() {
    if (this.state.templates) {
      return (
        <table className="table table-hover">
          <tbody>
          {this.state.templates.map((template, index) => {
            let className = '';
            if (this.props.active && template.id === this.props.active._id) {
              className = 'active';
            }

            let templateURL = '/template/edit/' + template.id;
            return (

                <tr key={template.id}>
                  <td>
                    <Link className={className} to={templateURL}>
                      {template.value.name}
                    </Link>
                  </td>
                  <td>
                    <a href="#" className="fa fa-trash" onClick={this.delete.bind(this, template, index)}></a>
                  </td>
                </tr>
          );
          })}
          </tbody>
        </table>
      );
    }

    return <p>Fetching...</p>;
  }

  delete(template, index, event) {
    event.preventDefault();
    return request.delete('/api/templates', template.value)
    .then(() => {
      this.state.templates.splice(index, 1);
      this.setState({templates: this.state.templates});
    });
  }

  render() {
    return (
      <div>
        <h4>Templates list</h4>
        {this.renderTemplates()}
      </div>
    );
  }
}

TemplatesList.propTypes = {
  active: PropTypes.object,
  templates: PropTypes.array
};

export default TemplatesList;
