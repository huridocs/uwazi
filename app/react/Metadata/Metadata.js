import React, {PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {Link} from 'react-router';

import {setTemplates, deleteTemplate} from 'app/Templates/actions/templatesActions';
import {setThesauris, deleteThesauri} from 'app/Thesauris/actions/thesaurisActions';
import templatesAPI from 'app/Templates/TemplatesAPI';
import thesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import RouteHandler from 'app/controllers/App/RouteHandler';

import 'app/Metadata/scss/metadata.scss';

export class Metadata extends RouteHandler {

  static requestState() {
    return Promise.all([templatesAPI.get(), thesaurisAPI.get()])
    .then((results) => {
      return {templates: results[0], thesauris: results[1]};
    });
  }

  setReduxState({templates, thesauris}) {
    this.props.setTemplates(templates);
    this.props.setThesauris(thesauris);
  }

  render() {
    return (
      <div className="row metadata">
        <div className="col-sm-4">
          <div className="panel panel-default">
            <div className="panel-heading">Document type</div>
            <ul className="list-group">
              {this.props.templates.map((template, index) => {
                return <li key={index} className="list-group-item">
                          <Link to={'/templates/edit/' + template._id}>{template.name}</Link>
                          <div onClick={() => this.props.deleteTemplate(template)} className="btn btn-danger btn-xs pull-right template-remove">
                            <i className="fa fa-trash"></i>
                          </div>
                          &nbsp;
                          <Link to={'/templates/edit/' + template._id} className="btn btn-default btn-xs pull-right">
                            <i className="fa fa-pencil"></i>
                          </Link>
                       </li>;
              })}
            <Link to="/templates/new" className="panel-footer"><i className="fa fa-plus"></i> Add document type</Link>
            </ul>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="panel panel-default">
            <div className="panel-heading">Relationship types</div>
            <ul className="list-group">
              <li className="list-group-item"> <a href="metadata-relationship.html">Based on</a>
                <div className="btn btn-danger btn-xs pull-right"><i className="fa fa-trash"></i></div>
                <a href="metadata-relationship.html" className="btn btn-default btn-xs pull-right"><i className="fa fa-pencil"></i></a>
              </li>
              <li className="list-group-item"> <a href="metadata-relationship.html">Supports</a>
                <div className="btn btn-danger btn-xs pull-right"><i className="fa fa-trash"></i></div>
                <a href="metadata-relationship.html" className="btn btn-default btn-xs pull-right"><i className="fa fa-pencil"></i></a>
              </li>
              <li className="list-group-item"> <a href="metadata-relationship.html">Contradicts</a>
                <div className="btn btn-danger btn-xs pull-right"><i className="fa fa-trash"></i></div>
                <a href="metadata-relationship.html" className="btn btn-default btn-xs pull-right"><i className="fa fa-pencil"></i></a>
              </li>
              <div className="panel-footer"><i className="fa fa-plus"></i> Add relationship type</div>
            </ul>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="panel panel-default">
            <div className="panel-heading">Thesauris</div>
            <ul className="list-group">
              {this.props.thesauris.map((thesauri, index) => {
                return <li className="list-group-item" key={index}> <Link to={'/thesauris/edit/' + thesauri._id}>{thesauri.name}</Link>
                        <div onClick={() => this.props.deleteThesauri(thesauri)} className="btn btn-danger btn-xs pull-right thesauri-remove">
                          <i className="fa fa-trash"></i>
                        </div>
                        &nbsp;
                        <Link to={'/thesauris/edit/' + thesauri._id} className="btn btn-default btn-xs pull-right">
                          <i className="fa fa-pencil"></i>
                        </Link>
                      </li>;
              })}
              <Link to="/thesauris/new" className="panel-footer"><i className="fa fa-plus"></i> Add thesauri</Link>
            </ul>
          </div>
        </div>
      </div>

    );
  }
}

//when all components are integrated with redux we can remove this
Metadata.__redux = true;

Metadata.propTypes = {
  templates: PropTypes.array,
  thesauris: PropTypes.array
};

const mapStateToProps = (state) => {
  return {templates: state.templates.toJS(), thesauris: state.thesauris.toJS()};
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({setTemplates, deleteTemplate, setThesauris, deleteThesauri}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Metadata);
