import React, {PropTypes, Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {DropTarget} from 'react-dnd';
import {Form} from 'react-redux-form';
import {FormField} from 'app/Forms';
import {Link} from 'react-router';

import {inserted, addProperty} from 'app/Templates/actions/templateActions';
import MetadataProperty from 'app/Templates/components/MetadataProperty';
import RemovePropertyConfirm from 'app/Templates/components/RemovePropertyConfirm';

export class MetadataTemplate extends Component {
  render() {
    const {connectDropTarget, isOver} = this.props;

    return connectDropTarget(
      <div>
        <Form model="template.model" className="metadataTemplate panel-default panel">
          <RemovePropertyConfirm />
          <div className="metadataTemplate-heading panel-heading">
            <div className="form-group">
              <FormField model="template.model.name">
                <input placeholder="Template name" className="form-control"/>
              </FormField>
            </div>
            &nbsp;
            <Link to="/metadata" className="btn btn-default"><i className="fa fa-arrow-left"></i> Back</Link>
            &nbsp;
            <button type="submit" className="btn btn-success save-template">
              <i className="fa fa-save"/> Save Template
            </button>
          </div>
          <ul className="metadataTemplate-list list-group">
            {(() => {
              if (this.props.properties.length === 0) {
                return <div className={'no-properties' + (isOver ? ' isOver' : '')}>
                        <i className="fa fa-clone"></i>Drag properties here to start
                      </div>;
              }
            })()}
            {this.props.properties.map((config, index) => {
              return <MetadataProperty {...config} key={config.localID} index={index}/>;
            })}
          </ul>
        </Form>
      </div>
    );
  }
}

MetadataTemplate.propTypes = {
  connectDropTarget: PropTypes.func.isRequired,
  properties: PropTypes.array,
  isOver: PropTypes.bool
};

const target = {
  canDrop() {
    return true;
  },

  drop(props, monitor) {
    let item = monitor.getItem();

    let propertyAlreadyAdded = props.properties[item.index];

    if (propertyAlreadyAdded) {
      props.inserted(item.index);
      return;
    }

    props.addProperty({label: item.label, type: item.type}, props.properties.length);
    return {name: 'container'};
  }
};

let dropTarget = DropTarget('METADATA_OPTION', target, (connector, monitor) => ({
  connectDropTarget: connector.dropTarget(),
  isOver: monitor.isOver()
}))(MetadataTemplate);

export {dropTarget};

const mapStateToProps = ({template}) => {
  return {properties: template.model.properties};
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({inserted, addProperty}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps, null, {withRef: true})(dropTarget);
