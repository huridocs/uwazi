import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import {setTemplates} from './templatesActions';
import {Link} from 'react-router';
import templatesAPI from '~/controllers/Templates/TemplatesAPI';
import RouteHandler from '~/controllers/App/RouteHandler';
import Immutable from 'immutable';

import './scss/templates.scss';

class Templates extends RouteHandler {

  static requestState() {
    return templatesAPI.get()
    .then((templates) => {
      return {templates: Immutable.fromJS(templates)};
    });
  }

  setReduxState({templates}) {
    this.props.dispatch(setTemplates(templates));
  }

  render() {
    return (
      <div className="row">
        <main className="col-sm-12">
          <div className="well template">
            <Link to="/templates/new" className="btn btn-success">New template</Link>
            <h1>Templates list</h1>
            {this.props.templates.map((template, index) => {
              return <div className="well" key={index}>
                      {template.value.name}
                      <Link to={'/templates/edit/' + template.id} className='btn btn-success'>Edit</Link>
                     </div>;
            })}
          </div>
        </main>
      </div>
    );
  }
}

Templates.__redux = true;

Templates.propTypes = {
  templates: PropTypes.array
};

const mapStateToProps = (state) => {
  return {templates: state.templates.toJS()};
};

export default connect(mapStateToProps)(Templates);
