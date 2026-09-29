import reactDom from 'react-dom';

type FiberNode = {
  stateNode: unknown;
  child: FiberNode | null;
};

type ComponentInstance = {
  _reactInternals?: FiberNode;
  _reactInternalFiber?: FiberNode;
};

const isDomNode = (value: unknown): value is Element | Text =>
  typeof value === 'object' &&
  value !== null &&
  'nodeType' in value &&
  (value.nodeType === 1 || value.nodeType === 3);

const isComponentInstance = (value: object): value is ComponentInstance =>
  '_reactInternals' in value || '_reactInternalFiber' in value;

// oxlint-disable-next-line import/exports-last
export const findDOMNode = (component: unknown): Element | Text | null => {
  if (isDomNode(component)) {
    return component;
  }
  if (typeof component !== 'object' || component === null || !isComponentInstance(component)) {
    return null;
  }
  let fiber = component._reactInternals ?? component._reactInternalFiber;
  while (fiber) {
    if (isDomNode(fiber.stateNode)) {
      return fiber.stateNode;
    }
    fiber = fiber.child ?? undefined;
  }
  return null;
};

// oxlint-disable-next-line import/exports-last
export const installFindDOMNode = () => {
  Object.assign(reactDom, { findDOMNode });
};

installFindDOMNode();
