import React, {PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {Link} from 'react-router';
import Immutable from 'immutable';

import {setTemplates, deleteTemplate} from '~/Templates/actions/templatesActions';
import templatesAPI from '~/Templates/TemplatesAPI';
import RouteHandler from '~/controllers/App/RouteHandler';

import '~/Templates/scss/templates.scss';

export class Templates extends RouteHandler {

  static requestState() {
    return templatesAPI.get()
    .then((templates) => {
      return {templates: Immutable.fromJS(templates)};
    });
  }

  setReduxState({templates}) {
    this.props.setTemplates(templates);
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
                      <button onClick={() => this.props.deleteTemplate(template)} className="btn btn-danger template-remove">Delete</button>
                      <Link to={'/templates/edit/' + template.id} className='btn btn-success'>Edit</Link>
                     </div>;
            })}
          </div>
        </main>
      </div>
    );
  }
}

//when all components are integrated with redux we can remove this
Templates.__redux = true;

Templates.propTypes = {
  templates: PropTypes.array
};

const mapStateToProps = (state) => {
  return {templates: state.templates.toJS()};
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({setTemplates, deleteTemplate}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Templates);
