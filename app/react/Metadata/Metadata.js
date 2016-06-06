import React, {PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {Link} from 'react-router';

import {setTemplates, checkTemplateCanBeDeleted} from 'app/Templates/actions/templatesActions';
import {setThesauris, deleteThesauri} from 'app/Thesauris/actions/thesaurisActions';
import {setRelationTypes, checkRelationTypeCanBeDeleted} from 'app/RelationTypes/actions/relationTypesActions';
import templatesAPI from 'app/Templates/TemplatesAPI';
import thesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import RouteHandler from 'app/App/RouteHandler';
import CantDeleteTemplateAlert from 'app/Metadata/components/CantDeleteTemplateAlert';
import DeleteTemplateConfirm from 'app/Metadata/components/DeleteTemplateConfirm';
import CantDeleteRelationType from 'app/Metadata/components/CantDeleteRelationType';
import DeleteRelationTypeConfirm from 'app/Metadata/components/DeleteRelationTypeConfirm';

import 'app/Metadata/scss/metadata.scss';

export class Metadata extends RouteHandler {

  static requestState() {
    return Promise.all([templatesAPI.get(), thesaurisAPI.get(), relationTypesAPI.get()])
    .then(([templates, thesauris, relationTypes]) => {
      return {templates, thesauris, relationTypes};
    });
  }

  setReduxState({templates, thesauris, relationTypes}) {
    this.props.setTemplates(templates);
    this.props.setThesauris(thesauris);
    this.props.setRelationTypes(relationTypes);
  }

  render() {
    return (
      <div className="row metadata">
        <div className="col-sm-4">
          <div className="panel panel-default">
            <div className="panel-heading">Document type</div>
            <CantDeleteTemplateAlert />
            <DeleteTemplateConfirm />
            <ul className="list-group">
              {this.props.templates.map((template, index) => {
                return <li key={index} className="list-group-item">
                          <Link to={'/templates/edit/' + template._id}>{template.name}</Link>
                          <div onClick={() => this.props.checkTemplateCanBeDeleted(template)}
                            className="btn btn-danger btn-xs pull-right template-remove">
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
            <div className="panel-heading">Relation types</div>
            <CantDeleteRelationType />
            <DeleteRelationTypeConfirm />
            <ul className="list-group">
              {this.props.relationTypes.map((relationType, index) => {
                return <li className="list-group-item" key={index}> <Link to={'/relationtypes/edit/' + relationType._id}>{relationType.name}</Link>
                        <div
                          onClick={() => this.props.checkRelationTypeCanBeDeleted(relationType)}
                          className="btn btn-danger btn-xs pull-right relation-type-remove">
                          <i className="fa fa-trash"></i>
                        </div>
                        &nbsp;
                        <Link to={'/relationtypes/edit/' + relationType._id} className="btn btn-default btn-xs pull-right">
                          <i className="fa fa-pencil"></i>
                        </Link>
                      </li>;
              })}
              <Link to="/relationtypes/new" className="panel-footer"><i className="fa fa-plus"></i> Add relation type</Link>
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

Metadata.propTypes = {
  templates: PropTypes.array,
  thesauris: PropTypes.array,
  relationTypes: PropTypes.array,
  checkTemplateCanBeDeleted: PropTypes.func
};

const mapStateToProps = (state) => {
  return {
    templates: state.templates.toJS(),
    thesauris: state.thesauris.toJS(),
    relationTypes: state.relationTypes.toJS()
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    setTemplates,
    checkTemplateCanBeDeleted,
    setThesauris,
    deleteThesauri,
    setRelationTypes,
    checkRelationTypeCanBeDeleted
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Metadata);
