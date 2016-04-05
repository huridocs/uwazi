import React, {Component, PropTypes} from 'react';
import {DragDropContext} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';


import {resetTemplate, saveTemplate} from 'app/Templates/actions/templateActions';
import PropertyOption from 'app/Templates/components/PropertyOption';
import MetadataTemplate from 'app/Templates/components/MetadataTemplate';
import FormControls from 'app/Templates/components/FormControls';
import 'app/Templates/scss/templates.scss';

export class TemplateCreator extends Component {

  componentWillUnmount() {
    this.props.resetTemplate();
  }

  render() {
    return (
      <div className="row">
        <main className="col-sm-9">
          <div className="well template">
            <FormControls/>
            <MetadataTemplate />
          </div>
        </main>
        <aside className="col-sm-3">
          <h1>Construction blocks</h1>
          <ul className="field-options">
            <li><PropertyOption label='Text' type='text'/></li>
            <li><PropertyOption label='Checkbox' type='checkbox' /></li>
            <li><PropertyOption label='Select' type='select'/></li>
            <li><PropertyOption label='List' type='list'/></li>
            <li><PropertyOption label='Date' type='date'/></li>
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
  return {
    template: state.template.data.toJS(),
    form: state.form.template
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({resetTemplate, saveTemplate}, dispatch);
}

export default DragDropContext(HTML5Backend)(
  connect(mapStateToProps, mapDispatchToProps)(TemplateCreator)
);
