import React, {PropTypes, Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import * as templatesActions from './templatesActions';
import {DropTarget} from 'react-dnd';
import MetadataProperty from './MetadataProperty';

const boxTarget = {
  drop(props, monitor) {
    let item = monitor.getItem();
    if (monitor.didDrop()) {
      let property = props.fields[item.index];
      property.inserting = null;
      props.updateProperty(property, item.index);
      return;
    }
    props.addProperty({name: item.name}, 0);
    return {name: 'container'};
  }
};

class MetadataTemplate extends Component {
  render() {
    const {connectDropTarget} = this.props;

    return connectDropTarget(
      <div className="template-properties">
        {(() => {
          if (this.props.fields.length === 0) {
            return <span>Drag properties here to start</span>;
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
  isOver: PropTypes.bool.isRequired,
  canDrop: PropTypes.bool.isRequired,
  fields: PropTypes.array
};

const mapStateToProps = (state) => {
  return {fields: state.fields.toJS()};
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators(templatesActions, dispatch);
}

let dropTarget = DropTarget('METADATA_OPTION', boxTarget, (connector, monitor) => ({
  connectDropTarget: connector.dropTarget(),
  isOver: monitor.isOver(),
  canDrop: monitor.canDrop()
}))(MetadataTemplate);

export default connect(mapStateToProps, mapDispatchToProps)(dropTarget);
