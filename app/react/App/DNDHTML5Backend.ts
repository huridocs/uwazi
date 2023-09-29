//@ts-ignore
import { DragDropContext } from 'react-dnd-old';
import { HTML5Backend } from 'react-dnd-html5-backend-old';

let context: any;

function DNDHTMLBackend(DecoratedClass: any) {
  if (context) {
    return context(DecoratedClass);
  }
  context = DragDropContext(HTML5Backend);
  return context(DecoratedClass);
}

export { DNDHTMLBackend };
