import React, {PropTypes, Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {updateProperty, addProperty} from './templatesActions';
import {DropTarget} from 'react-dnd';
import MetadataProperty from './MetadataProperty';

export class MetadataTemplate extends Component {
  render() {
    const {connectDropTarget, isOver} = this.props;

    return connectDropTarget(
      <div className="template-properties">
        {(() => {
          if (this.props.fields.length === 0) {
            return <div className={'no-properties' + (isOver ? ' isOver' : '')}>Drag properties here to start</div>;
          }
        })()}
        {this.props.fields.map((field, index) => {
          return <MetadataProperty {...field} key={field.id} index={index}/>;
        })}
      </div>
    );
  }
}

MetadataTemplate.propTypes = {
  connectDropTarget: PropTypes.func.isRequired,
  fields: PropTypes.array
};

const target = {
  canDrop() {
    return true;
  },

  drop(props, monitor) {
    let item = monitor.getItem();
    if (monitor.didDrop()) {
      let property = props.fields[item.index];
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
  return {fields: state.fields.toJS()};
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({updateProperty, addProperty}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps, null, {withRef: true})(dropTarget);
