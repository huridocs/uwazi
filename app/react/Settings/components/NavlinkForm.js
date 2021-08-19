import { DragSource, DropTarget } from 'react-dnd';
import { Field } from 'react-redux-form';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { findDOMNode } from 'react-dom';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { removeLink, addGroupLink, removeGroupLink } from 'app/Settings/actions/navlinksActions';
import { Icon } from 'UI';
import ShowIf from 'app/App/ShowIf';

const groupStyles = {
  paddingRight: '0px',
  display: 'flex',
};

const linkStyles = {
  display: 'flex',
};
export const LinkSource = {
  beginDrag(props) {
    return {
      id: props.localID,
      index: props.index,
    };
  },
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
    const hoverBoundingRect = findDOMNode(component).getBoundingClientRect(); // eslint-disable-line react/no-find-dom-node

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
  },
};
export class NavlinkForm extends Component {
  render() {
    const {
      link,
      links,
      index,
      isDragging,
      connectDragPreview,
      connectDragSource,
      connectDropTarget,
      formState,
    } = this.props;
    let className = `list-group-item${isDragging ? ' dragging' : ''}`;
    let titleClass = 'input-group';

    if (formState.$form.errors[`links.${index}.title.required`]) {
      className += ' error';
      titleClass += ' has-error';
    }

    return connectDragPreview(
      connectDropTarget(
        <li className={className}>
          <div className="propery-form expand">
            <div>
              <div className="row">
                <div className="col-sm-12">
                  <div className="row">
                    <div
                      className={link.type === 'group' ? 'col-sm-11' : 'col-sm-3'}
                      style={link.type === 'group' ? groupStyles : linkStyles}
                    >
                      {connectDragSource(
                        <span
                          className="property-name"
                          style={{ paddingRight: '10px', width: '70px' }}
                        >
                          <Icon icon="bars" className="reorder" />
                          &nbsp;
                          <Icon icon={link.type === 'group' ? 'caret-square-down' : 'link'} />
                        </span>
                      )}
                      <div className={`${titleClass} input-group-width`}>
                        <span className="input-group-addon">Title</span>
                        <Field model={`settings.navlinksData.links[${index}].title`}>
                          <input className="form-control" style={{ width: 'calc(100% + 5px)' }} />
                        </Field>
                      </div>
                    </div>
                    <ShowIf if={link.type !== 'group'}>
                      <div className="col-sm-8" style={{ paddingRight: '0px' }}>
                        <div className="input-group">
                          <span className="input-group-addon">URL</span>
                          <Field model={`settings.navlinksData.links[${index}].url`}>
                            <input className="form-control" style={{ width: 'calc(100% + 5px)' }} />
                          </Field>
                        </div>
                      </div>
                    </ShowIf>
                    <div className="col-sm-1">
                      <button
                        type="button"
                        className="btn btn-danger btn-xs property-remove, menu-delete-button"
                        style={{ marginLeft: '4px' }}
                        onClick={() => this.props.removeLink(index)}
                      >
                        <Icon icon="trash-alt" /> Delete
                      </button>
                    </div>
                  </div>
                  <div className="row">
                    <ShowIf if={link.type === 'group'}>
                      <div style={{ paddingLeft: '80px' }}>
                        <div className="row">
                          <div className="col-sm-12">
                            {links[index].sublinks?.map((_, i) => (
                              <div
                                className="row"
                                style={{ paddingBottom: '5px', paddingTop: '5px' }}
                                key={i}
                              >
                                <div className="col-sm-3" style={{ display: 'flex' }}>
                                  <span style={{ padding: '5px 10px 0px 0px' }}>
                                    <Icon icon="link" />
                                  </span>
                                  <div className={`${titleClass} input-group-width`}>
                                    <span className="input-group-addon">Title</span>
                                    <Field
                                      model={`settings.navlinksData.links[${index}].sublinks[${i}].title`}
                                    >
                                      <input className="form-control" style={{ width: '100%' }} />
                                    </Field>
                                  </div>
                                </div>
                                <div className="col-sm-8">
                                  <div className="input-group">
                                    <span className="input-group-addon">URL</span>
                                    <Field
                                      model={`settings.navlinksData.links[${index}].sublinks[${i}].url`}
                                    >
                                      <input className="form-control" />
                                    </Field>
                                  </div>
                                </div>
                                <div className="col-sm-1" style={{ paddingLeft: '0px' }}>
                                  <button
                                    type="button"
                                    className="btn btn-danger btn-xs property-remove, menu-delete-button"
                                    onClick={() => this.props.removeGroupLink(index, i)}
                                  >
                                    <Icon icon="trash-alt" /> Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                            <div className="row">
                              <div className="col-sm-12">
                                <button
                                  className="menu-link-group-button"
                                  type="button"
                                  onClick={this.props.addGroupLink.bind(this, links, index)}
                                >
                                  <Icon icon="link" />
                                  &nbsp;Add link
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ShowIf>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </li>
      )
    );
  }
}

NavlinkForm.propTypes = {
  connectDragSource: PropTypes.func.isRequired,
  connectDragPreview: PropTypes.func.isRequired,
  connectDropTarget: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
  isDragging: PropTypes.bool.isRequired,
  id: PropTypes.any.isRequired,
  link: PropTypes.object.isRequired,
  links: PropTypes.array.isRequired,
  sortLink: PropTypes.func.isRequired,
  removeLink: PropTypes.func,
  formState: PropTypes.object.isRequired,
  addGroupLink: PropTypes.func.isRequired,
  removeGroupLink: PropTypes.func,
};

const dropTarget = DropTarget('LINK', LinkTarget, connectDND => ({
  connectDropTarget: connectDND.dropTarget(),
}))(NavlinkForm);

const dragSource = DragSource('LINK', LinkSource, (connectDND, monitor) => ({
  connectDragSource: connectDND.dragSource(),
  connectDragPreview: connectDND.dragPreview(),
  isDragging: monitor.isDragging(),
}))(dropTarget);

export function mapStateToProps({ settings }) {
  const { links } = settings.navlinksData;
  return {
    formState: settings.navlinksFormState,
    links,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ removeLink, addGroupLink, removeGroupLink }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(dragSource);
