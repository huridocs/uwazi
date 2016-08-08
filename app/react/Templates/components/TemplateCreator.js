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
      <div className="metadata">
        <main className="col-sm-9">
            <MetadataTemplate />
        </main>
        <aside className="col-sm-3">
          <h1>Construction blocks</h1>
          <div className="metadataTemplate-constructor panel panel-default">
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
