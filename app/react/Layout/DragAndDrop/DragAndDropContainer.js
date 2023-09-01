import PropTypes from 'prop-types';
import React, { Component } from 'react';
// import { DropTarget } from 'react-dnd';
import { DNDHTMLBackend } from 'app/App/DNDHTML5Backend';
import ID from 'shared/uniqueID';
import { Translate } from 'app/I18N';
import { DragAndDropItem } from './DragAndDropItem';

export class DragAndDropContainer extends Component {
  constructor(props) {
    super(props);
    this.state = { id: props.id || ID() };
    this.container = { id: this.state.id };
    this.moveItem = this.moveItem.bind(this);
    this.removeItem = this.removeItem.bind(this);
    this.renderItem = this.renderItem.bind(this);
  }

  moveItem(_dragIndex, hoverIndex, item) {
    const dragIndex = _dragIndex;
    const items = this.props.items.concat();
    if (!items.find(_item => _item.id === item.id)) {
      return;
    }
    items.splice(dragIndex, 1);
    items.splice(hoverIndex, 0, item.originalItem || item);
    this.props.onChange(items);
  }

  removeItem(id) {
    let items = this.props.items.concat();
    items = items.filter(item => item.id !== id);
    this.props.onChange(items);
  }

  renderItem(item, index) {
    if (this.props.renderItem) {
      return this.props.renderItem(item, index);
    }

    return item.content;
  }

  render() {
    const { connectDropTarget, items, iconHandle } = this.props;
    return (
      <div>
        {connectDropTarget(
          <ul className="list-group">
            {items.map((item, index) => (
              <DragAndDropItem
                moveItem={this.moveItem}
                removeItem={this.removeItem}
                index={index}
                iconHandle={iconHandle || !!item.items}
                key={item.id}
                name={item.name}
                container={this.container}
                items={item.items}
                id={item.id}
                originalItem={item}
              >
                {this.renderItem}
              </DragAndDropItem>
            ))}
            <div className="no-properties">
              <div className="no-properties-wrap">
                <Translate>Drag items here</Translate>
              </div>
            </div>
          </ul>
        )}
      </div>
    );
  }
}

DragAndDropContainer.defaultProps = {
  iconHandle: false,
};

DragAndDropContainer.propTypes = {
  items: PropTypes.array,
  id: PropTypes.string,
  isOver: PropTypes.bool,
  renderItem: PropTypes.func,
  connectDropTarget: PropTypes.func,
  onChange: PropTypes.func,
  iconHandle: PropTypes.bool,
};

export const containerTarget = {
  drop(props, monitor, component) {
    const item = monitor.getItem();
    if (item.id === component.state.id) {
      return;
    }
    if (!monitor.getDropResult() || !monitor.getDropResult().id) {
      const items = props.items.concat();
      if (!items.find(_item => _item.id === item.id)) {
        items.push(item.originalItem || item);
        props.onChange(items);
      }
      return { id: component.state.id };
    }
  },
};

const dragAndDropContainer = null;
// DropTarget('DRAG_AND_DROP_ITEM', containerTarget, connect => ({
//   connectDropTarget: connect.dropTarget(),
// }))(DragAndDropContainer);

export default DNDHTMLBackend(dragAndDropContainer);
