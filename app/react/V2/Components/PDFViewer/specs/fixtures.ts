import { PDFProps } from '../PDF.jsx';

const highlights: PDFProps['highlights'] = {
  2: [
    {
      key: '1',
      color: 'red',
      textSelection: {
        text: 'example',
        selectionRectangles: [{ left: 1, top: 2, width: 10, height: 5 }],
      },
    },
  ],
  5: [
    {
      key: '3',
      textSelection: { selectionRectangles: [{ top: 20, width: 100, left: 0, height: 30 }] },
      color: 'blue',
    },
  ],
};

class mockEventBus {
  listeners: Record<string, Function[]> = {};

  on(eventName: string, listener: Function) {
    this.listeners[eventName] = this.listeners[eventName] || [];
    this.listeners[eventName].push(listener);
  }

  off(eventName: string, listener: Function) {
    this.listeners[eventName] = (this.listeners[eventName] || []).filter(l => l !== listener);
  }

  dispatch(eventName: string, data: any) {
    (this.listeners[eventName] || []).forEach(l => l(data));
  }
}

export { highlights, mockEventBus };
