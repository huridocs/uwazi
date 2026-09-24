import { useEffect, useRef, type MutableRefObject } from 'react';

const LONG_PRESS_MS = 500;
const SLOP_PX = 10;

type PressState = {
  timer: number;
  start: { x: number; y: number } | null;
  fired: boolean;
};

type PressHandlers = {
  pointerdown: EventListener;
  pointermove: EventListener;
  pointerup: EventListener;
  click: EventListener;
  contextmenu: EventListener;
};

const selectIdAt = (target: EventTarget | null) => {
  if (!(target instanceof Element)) {
    return null;
  }
  const host = target.closest('[data-select-id]');
  if (!host) {
    return null;
  }
  const control = target.closest('a, button, input, textarea, select, label');
  if (control && control !== host) {
    return null;
  }
  return host.getAttribute('data-select-id');
};

const asPointer = (event: Event): PointerEvent | undefined => {
  if ('pointerType' in event && 'clientX' in event) {
    return event as PointerEvent;
  }
  return undefined;
};

const cancelPress = (state: PressState) => {
  window.clearTimeout(state.timer);
  state.start = null;
};

const beginPress = (state: PressState, event: PointerEvent, onAdd: (sharedId: string) => void) => {
  state.fired = false;
  cancelPress(state);
  if (event.pointerType !== 'touch') {
    return;
  }
  const sharedId = selectIdAt(event.target);
  if (!sharedId) {
    return;
  }
  state.start = { x: event.clientX, y: event.clientY };
  state.timer = window.setTimeout(() => {
    state.fired = true;
    state.start = null;
    onAdd(sharedId);
  }, LONG_PRESS_MS);
};

const movePress = (state: PressState, event: PointerEvent) => {
  if (!state.start) {
    return;
  }
  const moved = Math.hypot(event.clientX - state.start.x, event.clientY - state.start.y);
  if (moved > SLOP_PX) {
    cancelPress(state);
  }
};

const swallowClick = (state: PressState, event: Event) => {
  if (!state.fired) {
    return;
  }
  state.fired = false;
  event.preventDefault();
  event.stopPropagation();
};

const blockContextMenu = (event: Event) => {
  const pointer = asPointer(event);
  if (pointer && pointer.pointerType !== 'touch') {
    return;
  }
  if (selectIdAt(event.target)) {
    event.preventDefault();
  }
};

const pressHandlers = (
  state: PressState,
  onAddRef: MutableRefObject<(sharedId: string) => void>
): PressHandlers => ({
  pointerdown: event => {
    const pointer = asPointer(event);
    if (!pointer) {
      return;
    }
    beginPress(state, pointer, sharedId => onAddRef.current(sharedId));
  },
  pointermove: event => {
    const pointer = asPointer(event);
    if (!pointer) {
      return;
    }
    movePress(state, pointer);
  },
  pointerup: () => cancelPress(state),
  click: event => swallowClick(state, event),
  contextmenu: blockContextMenu,
});

const captureBindings = (handlers: PressHandlers): [string, EventListener][] => [
  ['pointerdown', handlers.pointerdown],
  ['pointermove', handlers.pointermove],
  ['pointerup', handlers.pointerup],
  ['pointercancel', handlers.pointerup],
  ['click', handlers.click],
  ['contextmenu', handlers.contextmenu],
];

const listenCapture = (handlers: PressHandlers, add: boolean) => {
  captureBindings(handlers).forEach(([type, handler]) => {
    if (add) {
      document.addEventListener(type, handler, true);
      return;
    }
    document.removeEventListener(type, handler, true);
  });
};

/** Touch long-press adds the library entity under the finger. A mouse press
 *  does not, so shift and ctrl clicks stay the desktop gestures. */
const attachLibraryLongPress = (onAddRef: MutableRefObject<(sharedId: string) => void>) => {
  const state: PressState = { timer: 0, start: null, fired: false };
  const handlers = pressHandlers(state, onAddRef);
  listenCapture(handlers, true);
  return () => {
    cancelPress(state);
    listenCapture(handlers, false);
  };
};

const useLibraryLongPress = (onAdd: (sharedId: string) => void) => {
  const onAddRef = useRef(onAdd);
  onAddRef.current = onAdd;
  useEffect(() => attachLibraryLongPress(onAddRef), []);
};

export { LONG_PRESS_MS, useLibraryLongPress };
