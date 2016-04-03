import React, {Component, PropTypes} from 'react';
import {DragDropContext} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {Link} from 'react-router';

import {resetTemplate, saveTemplate} from '~/Templates/actions/templateActions';
import PropertyOption from '~/Templates/components/PropertyOption';
import MetadataTemplate from '~/Templates/components/MetadataTemplate';
import '~/Templates/scss/templates.scss';

export class TemplateCreator extends Component {

  componentWillUnmount() {
    this.props.resetTemplate();
  }

  render() {
    return (
      <div className="row">
        <main className="col-sm-9">
          <div className="well template">
            <Link to="/templates" className="btn btn-default">Cancel</Link>
            <button onClick={() => this.props.saveTemplate(this.props.template)} className="btn btn-success save-template">
              <i className="fa fa-save"/> Save Template
            </button>
            <MetadataTemplate />
          </div>
        </main>
        <aside className="col-sm-3">
          <h1>Construction blocks</h1>
          <ul className="field-options">
            <li><PropertyOption label='Text' /></li>
            <li><PropertyOption label='Checkbox' /></li>
            <li><PropertyOption label='Select' /></li>
            <li><PropertyOption label='List' /></li>
            <li><PropertyOption label='Date' /></li>
          </ul>
        </aside>
      </div>
    );
  }
}

TemplateCreator.propTypes = {
  saveTemplate: PropTypes.func,
  resetTemplate: PropTypes.func,
  template: PropTypes.object
};

const mapStateToProps = (state) => {
  return {template: state.template.data.toJS()};
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({resetTemplate, saveTemplate}, dispatch);
}

export default DragDropContext(HTML5Backend)(
  connect(mapStateToProps, mapDispatchToProps)(TemplateCreator)
);
