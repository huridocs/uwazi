/* eslint-disable max-statements */
import type { XYCoord } from 'dnd-core';
import { RefObject } from 'react';

interface DragItem {
  index: number;
  id: string;
  type: string;
}
// export const itemSource = {
//   beginDrag(props) {
//     return {
//       id: props.id,
//       name: props.name,
//       items: props.items,
//       container: props.container,
//       index: props.index,
//       originalItem: props.originalItem,
//     };
//   },

//   endDrag(props, monitor) {
//     const container = monitor.getDropResult();
//     if (container && container.id !== props.container.id) {
//       props.removeItem(props.id);
//     }
//   },
// };

export const hoverSortable =
  (ref: RefObject<HTMLElement>, index: number, sortFunction: Function) =>
  (item: DragItem, monitor: any) => {
    if (!ref.current) {
      return;
    }
    const dragIndex = item.index;
    const hoverIndex = index;

    // Don't replace items with themselves
    if (dragIndex === hoverIndex) {
      return;
    }

    // Determine rectangle on screen
    const hoverBoundingRect = ref.current?.getBoundingClientRect();

    // Get vertical middle
    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

    // Determine mouse position
    const clientOffset = monitor.getClientOffset();

    // Get pixels to the top
    const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

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
    sortFunction(dragIndex, hoverIndex);

    // Note: we're mutating the monitor item here!
    // Generally it's better to avoid mutations,
    // but it's good here for the sake of performance
    // to avoid expensive index searches.
    item.index = hoverIndex;
  };
// export class DragAndDropItem extends Component {
//   render() {
//     const { iconHandle, isDragging, connectDragPreview, connectDragSource, connectDropTarget } =
//       this.props;
//     let propertyClass = 'list-group-item';
//     if (isDragging) {
//       propertyClass += ' dragging';
//     }

//     if (!iconHandle) {
//       propertyClass += ' draggable';
//     }

//     const result = connectDropTarget(
//       <div className={propertyClass}>
//         {iconHandle ? (
//           connectDragSource(
//             <span className="draggable">
//               <Icon icon="bars" />
//             </span>
//           )
//         ) : (
//           <Icon icon="bars" />
//         )}
//         {this.props.children(this.props.originalItem, this.props.index)}
//       </div>
//     );

//     if (!iconHandle) {
//       return connectDragSource(result);
//     }

//     return connectDragPreview(result);
//   }
// }

// DragAndDropItem.defaultProps = {
//   iconHandle: false,
//   children: () => {},
// };

// DragAndDropItem.propTypes = {
//   connectDragSource: PropTypes.func.isRequired,
//   connectDragPreview: PropTypes.func.isRequired,
//   connectDropTarget: PropTypes.func.isRequired,
//   index: PropTypes.number.isRequired,
//   isDragging: PropTypes.bool.isRequired,
//   iconHandle: PropTypes.bool,
//   id: PropTypes.any.isRequired,
//   moveItem: PropTypes.func.isRequired,
//   children: PropTypes.func,
//   originalItem: PropTypes.object.isRequired,
// };

// const dragAndDropItem = () => {};
// const dragAndDropItem = DropTarget('DRAG_AND_DROP_ITEM', itemTarget, connector => ({
//   connectDropTarget: connector.dropTarget(),
// }))(DragAndDropItem);

// dragAndDropItem = DragSource('DRAG_AND_DROP_ITEM', itemSource, (connector, monitor) => ({
//   connectDragSource: connector.dragSource(),
//   connectDragPreview: connector.dragPreview(),
//   isDragging: monitor.isDragging(),
// }))(dragAndDropItem);

// export default connect()(dragAndDropItem);
