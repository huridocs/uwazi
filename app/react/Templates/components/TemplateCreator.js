import React, {Component, PropTypes} from 'react';
import {DragDropContext} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';


import {resetTemplate} from 'app/Templates/actions/templateActions';
import PropertyOption from 'app/Templates/components/PropertyOption';
import MetadataTemplate from 'app/Templates/components/MetadataTemplate';
import 'app/Templates/scss/templates.scss';

export class TemplateCreator extends Component {

  componentWillUnmount() {
    this.props.resetTemplate();
  }

  render() {
    return (
      <div className="row metadata">
        <div className="col-xs-12 col-sm-3">
          <div className="panel panel-default">
            <div className="panel-heading">Settings</div>
            <div className="list-group">
              <button className="list-group-item">Account</button>
              <button className="list-group-item">Collection</button>
            </div>
          </div>
          <div className="panel panel-default">
            <div className="panel-heading">Metadata</div>
            <div className="list-group">
              <button className="list-group-item active">Documents</button>
              <button className="list-group-item">Connections</button>
              <button className="list-group-item">Thesauris</button>
            </div>
          </div>
        </div>
        <main className="col-xs-12 col-sm-7">
            <MetadataTemplate />
        </main>
        <aside className="col-xs-12 col-sm-2">
          <div className="metadataTemplate-constructor panel panel-default">
            <div className="panel-heading">Properties</div>
            <ul className="list-group">
              <PropertyOption label='Text' type='text'/>
              <PropertyOption label='Select' type='select'/>
              <PropertyOption label='Date' type='date'/>
            </ul>
          </div>
        </aside>
      </div>
    );
  }
}

TemplateCreator.propTypes = {
  resetTemplate: PropTypes.func
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({resetTemplate}, dispatch);
}

export default DragDropContext(HTML5Backend)(
  connect(null, mapDispatchToProps)(TemplateCreator)
);
