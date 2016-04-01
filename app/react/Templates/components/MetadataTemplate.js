import React, {PropTypes, Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {DropTarget} from 'react-dnd';

import {updateProperty, addProperty} from '~/Templates/actions/templateActions';
import MetadataProperty from '~/Templates/components/MetadataProperty';

export class MetadataTemplate extends Component {
  render() {
    const {connectDropTarget, isOver} = this.props;

    return connectDropTarget(
      <div className="template-properties">
        {(() => {
          if (this.props.properties.length === 0) {
            return <div className={'no-properties' + (isOver ? ' isOver' : '')}>Drag properties here to start</div>;
          }
        })()}
        {this.props.properties.map((config, index) => {
          return <MetadataProperty {...config} key={config.id} index={index}/>;
        })}
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
    if (monitor.didDrop()) {
      let property = props.properties[item.index];
      property.inserting = null;
      props.updateProperty(property, item.index);
      return;
    }
    props.addProperty({label: item.label}, 0);
    return {name: 'container'};
  }
};

let dropTarget = DropTarget('METADATA_OPTION', target, (connector, monitor) => ({
  connectDropTarget: connector.dropTarget(),
  isOver: monitor.isOver()
}))(MetadataTemplate);

export {dropTarget};

const mapStateToProps = (state) => {
  return {properties: state.template.data.toJS().properties};
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({updateProperty, addProperty}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps, null, {withRef: true})(dropTarget);
