import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {DragDropContext} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import {resetTemplate, saveTemplate, saveEntity} from 'app/Templates/actions/templateActions';
import PropertyOption from 'app/Templates/components/PropertyOption';
import MetadataTemplate from 'app/Templates/components/MetadataTemplate';
import 'app/Templates/scss/templates.scss';
import ShowIf from 'app/App/ShowIf';

export class TemplateCreator extends Component {

  componentWillUnmount() {
    this.props.resetTemplate();
  }

  render() {
    let save = this.props.saveTemplate;
    let backUrl = '/settings/documents';
    if (this.props.entity) {
      save = this.props.saveEntity;
      backUrl = '/settings/entities';
    }

    return (
      <div className="metadata">
        <div className="panel panel-default">
          <div className="panel-heading">
            Metadata creator
          </div>
          <div className="panel-body">
            <div className="row">
              <main className="col-xs-12 col-sm-9">
                <MetadataTemplate saveTemplate={save} backUrl={backUrl} />
              </main>
              <aside className="col-xs-12 col-sm-3">
                <div className="metadataTemplate-constructor">
                  <div><i>Properties</i></div>
                  <ul className="list-group">
                    <PropertyOption label='Text' type='text'/>
                    <PropertyOption label='Numeric' type='numeric'/>
                    <PropertyOption label='Select' type='select' disabled={this.props.noThesauris} />
                    <PropertyOption label='Multi Select' type='multiselect' disabled={this.props.noThesauris} />
                    <PropertyOption label='Date' type='date'/>
                    <PropertyOption label='Date Range' type='daterange'/>
                    <PropertyOption label='Multi Date' type='multidate'/>
                    <PropertyOption label='Multi Date Range' type='multidaterange'/>
                    <PropertyOption label='Rich Text' type='markdown'/>
                    <ShowIf if={this.props.settings.collection.toJS().project === 'cejil'}>
                      <PropertyOption label='Violated articles' type='nested'/>
                    </ShowIf>
                  </ul>
                  <ShowIf if={this.props.noThesauris}>
                    <div className="alert alert-warning">
                      Selects and Multiselects can not be added untill you have at least one thesauri to select.
                    </div>
                  </ShowIf>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

TemplateCreator.propTypes = {
  resetTemplate: PropTypes.func,
  saveTemplate: PropTypes.func,
  saveEntity: PropTypes.func,
  entity: PropTypes.bool,
  noThesauris: PropTypes.bool,
  settings: PropTypes.object
};

TemplateCreator.contextTypes = {
  router: PropTypes.object
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({resetTemplate, saveTemplate, saveEntity}, dispatch);
}

const mapStateToProps = ({settings, thesauris}) => {
  return {
    settings,
    noThesauris: !thesauris.size
  };
};

export default DragDropContext(HTML5Backend)(
  connect(mapStateToProps, mapDispatchToProps)(TemplateCreator)
);
