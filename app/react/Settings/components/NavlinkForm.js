import React, {Component, PropTypes} from 'react';
import {findDOMNode} from 'react-dom';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {DragSource, DropTarget} from 'react-dnd';

import {Field} from 'react-redux-form';
import ShowIf from 'app/App/ShowIf';

import {removeLink} from 'app/Settings/actions/navlinksActions';
import {editLink} from 'app/Settings/actions/uiActions';

export const LinkSource = {
  beginDrag(props) {
    return {
      id: props.localID,
      index: props.index
    };
  }
};

export const LinkTarget = {
  hover(props, monitor, component) {
    const dragIndex = monitor.getItem().index;
    const hoverIndex = props.index;

    // Don't replace items with themselves
    if (dragIndex === hoverIndex) {
      return;
    }

    // Determine rectangle on screen
    const hoverBoundingRect = findDOMNode(component).getBoundingClientRect();

    // Get vertical middle
    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

    // Determine mouse position
    const clientOffset = monitor.getClientOffset();

    // Get pixels to the top
    const hoverClientY = clientOffset.y - hoverBoundingRect.top;

    // Only perform the move when the mouse has crossed half of the items height
    // When dragging downwards, only move when the cursor is below 50%
    // When dragging upwards, only move when the cursor is above 50%

    // Dragging downwards
    if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
      return;
    }

    // Dragging upwards
    if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
      return;
    }

    // Time to actually perform the action
    props.sortLink(dragIndex, hoverIndex);

    // Note: we're mutating the monitor item here!
    // Generally it's better to avoid mutations,
    // but it's good here for the sake of performance
    // to avoid expensive index searches.
    monitor.getItem().index = hoverIndex;
  }
};

export class NavlinkForm extends Component {
  render() {
    const {link, index, isDragging, connectDragSource, connectDropTarget, formState, uiState} = this.props;

    let className = 'list-group-item' + (isDragging ? ' dragging' : '');
    let titleClass = 'input-group';
    
    if (formState.$form.errors[`links.${index}.title.required`]) {
      className += ' error';
      titleClass += ' has-error';
    }

    return connectDragSource(connectDropTarget(
      <li className={className}>

        <div>
          <span className="property-name">
            <i className="fa fa-reorder"></i>&nbsp;
            <i className="fa fa-link"></i>&nbsp;&nbsp;{link.title && link.title.trim().length ? link.title : <em>no title</em>}
          </span>
        </div>
        <div>
          <button type="button"
                  className="btn btn-default btn-xs property-edit"
                  onClick={() => this.props.editLink(link.localID)}>
            <i className="fa fa-pencil"></i> Edit
          </button>
          <button type="button"
                  className="btn btn-danger btn-xs property-remove"
                  onClick={() => this.props.removeLink(index)}>
            <i className="fa fa-trash"></i> Delete
          </button>
        </div>

        <ShowIf if={uiState.get('editingLink') === link.localID}>
          <div className="propery-form expand">
            <div>
              <div className="row">
                <div className="col-sm-4">
                  <div className={titleClass}>
                    <span className="input-group-addon">
                      Title
                    </span>
                    <Field model={`settings.navlinksData.links[${index}].title`}>
                      <input className="form-control" />
                    </Field>
                  </div>
                </div>
                <div className="col-sm-8">
                  <div className="input-group">
                    <span className="input-group-addon">
                      URL
                    </span>
                    <Field model={`settings.navlinksData.links[${index}].url`}>
                      <input className="form-control" />
                    </Field>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ShowIf>

      </li>
    ));
  }
}

NavlinkForm.propTypes = {
  connectDragSource: PropTypes.func.isRequired,
  connectDropTarget: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
  isDragging: PropTypes.bool.isRequired,
  id: PropTypes.any.isRequired,
  link: PropTypes.object.isRequired,
  sortLink: PropTypes.func.isRequired,
  editLink: PropTypes.func,
  removeLink: PropTypes.func,
  formState: PropTypes.object.isRequired,
  uiState: PropTypes.object.isRequired
};

const dropTarget = DropTarget('LINK', LinkTarget, connectDND => ({
  connectDropTarget: connectDND.dropTarget()
}))(NavlinkForm);

const dragSource = DragSource('LINK', LinkSource, (connectDND, monitor) => ({
  connectDragSource: connectDND.dragSource(),
  isDragging: monitor.isDragging()
}))(dropTarget);

export function mapStateToProps({settings}) {
  return {formState: settings.navlinksFormState, uiState: settings.uiState};
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({editLink, removeLink}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(dragSource);
