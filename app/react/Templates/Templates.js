import React, {PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {Link} from 'react-router';
import Immutable from 'immutable';

import {setTemplates, deleteTemplate} from '~/Templates/actions/templatesActions';
import {setThesauris, deleteThesauri} from '~/Thesauris/actions/thesaurisActions';
import templatesAPI from '~/Templates/TemplatesAPI';
import thesaurisAPI from '~/Thesauris/ThesaurisAPI';
import RouteHandler from '~/controllers/App/RouteHandler';

import '~/Templates/scss/templates.scss';

export class Templates extends RouteHandler {

  static requestState() {
    return Promise.all([templatesAPI.get(), thesaurisAPI.get()])
    .then((results) => {
      return {templates: Immutable.fromJS(results[0]), thesauris: Immutable.fromJS(results[1])};
    });
  }

  setReduxState({templates, thesauris}) {
    this.props.setTemplates(templates);
    this.props.setThesauris(thesauris);
  }

  render() {
    return (
      <div className="row metadata">
        <main className="col-sm-12">
          <div className="row">
            <div className="col-sm-6">
              <div className="well templates">
                <Link to="/templates/new" className="btn btn-success">New template</Link>
                <h1>Templates list</h1>
                {this.props.templates.map((template, index) => {
                  return <div className="well" key={index}>
                          {template.name}
                          <button onClick={() => this.props.deleteTemplate(template)} className="btn btn-danger template-remove">Delete</button>
                          <Link to={'/templates/edit/' + template._id} className='btn btn-success'>Edit</Link>
                         </div>;
                })}
              </div>
            </div>
            <div className="col-sm-6">
              <div className="well thesauris">
                <Link to="/thesauris/new" className="btn btn-success">New thesauri</Link>
                <h1>Thesauris list</h1>
                {this.props.thesauris.map((thesauri, index) => {
                  return <div className="well" key={index}>
                          {thesauri.name}
                          <button onClick={() => this.props.deleteThesauri(thesauri)} className="btn btn-danger thesauri-remove">Delete</button>
                          <Link to={'/thesauris/edit/' + thesauri._id} className='btn btn-success'>Edit</Link>
                         </div>;
                })}
              </div>
            </div>
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
  return {templates: state.templates.toJS(), thesauris: state.thesauris.toJS()};
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({setTemplates, deleteTemplate, setThesauris, deleteThesauri}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Templates);
