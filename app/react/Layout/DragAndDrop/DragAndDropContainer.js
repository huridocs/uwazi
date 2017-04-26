import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {DragDropContext} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import DragAndDropItem from './DragAndDropItem';
import {DropTarget} from 'react-dnd';
import ID from 'shared/uniqueID';
import ShowIf from 'app/App/ShowIf';

export class DragAndDropContainer extends Component {

  constructor(props) {
    super(props);
    this.state = {id: props.id || ID()};
  }

  moveItem(_dragIndex, hoverIndex, item) {
    let dragIndex = _dragIndex;
    let items = this.props.items.concat();
    if (!items.find((_item) => _item.id === item.id)) {
      return;
    }

    items.splice(dragIndex, 1);
    items.splice(hoverIndex, 0, item);
    this.props.onChange(items);
  }

  removeItem(id) {
    let items = this.props.items.concat();
    items = items.filter((item) => item.id !== id);
    this.props.onChange(items);
  }

  renderItem(item) {
    if (this.props.renderItem) {
      return this.props.renderItem(item);
    }

    return item.content;
  }

  render() {
    return <div>
            {this.props.connectDropTarget(<ul className="list-group">
              {this.props.items.map((item, index) => {
                return <DragAndDropItem
                        moveItem={this.moveItem.bind(this)}
                        removeItem={this.removeItem.bind(this)}
                        index={index}
                        key={item.id}
                        name={item.name}
                        container={{id: this.state.id}}
                        items={item.items}
                        id={item.id}>
                          {this.renderItem(item)}
                        </DragAndDropItem>;
              })}
              <ShowIf if={!this.props.items.length}>
                <div className="no-properties">
                  <div className="no-properties-wrap">Drag items here</div>
                </div>
              </ShowIf>
            </ul>)}
          </div>;
  }
}

DragAndDropContainer.propTypes = {
  items: PropTypes.array,
  id: PropTypes.string,
  isOver: PropTypes.bool,
  renderItem: PropTypes.func,
  connectDropTarget: PropTypes.func,
  onChange: PropTypes.func
};

export const containerTarget = {
  drop(props, monitor, component) {
    let item = monitor.getItem();
    if (item.id === component.state.id) {
      return;
    }
    if (!monitor.getDropResult() || !monitor.getDropResult().id) {
      let items = props.items.concat();
      if (!items.find((_item) => _item.id === item.id)) {
        items.push(item);
        props.onChange(items);
      }
      return {id: component.state.id};
    }
  }
};

let dragAndDropContainer = DropTarget('DRAG_AND_DROP_ITEM', containerTarget, (connect) => ({
  connectDropTarget: connect.dropTarget()
}))(DragAndDropContainer);

export default DragDropContext(HTML5Backend)(dragAndDropContainer);
