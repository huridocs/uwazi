import React from 'react';
import { extendedHtmlTags, visualizationHtmlTags } from './utils.js';

const isValidTagName = (tagName: string, sanitized: boolean): boolean => {
  const list = !sanitized ? extendedHtmlTags : visualizationHtmlTags;
  return list.some(t => t.toLowerCase() === tagName.toLowerCase());
};

const isSyncNode = (node: React.ReactNode): node is Exclude<React.ReactNode, Promise<unknown>> =>
  typeof node !== 'object' || node === null || !('then' in node);

const ValidatedElement = (
  type: string | React.JSXElementConstructor<any>,
  props: (React.Attributes & { children?: React.ReactNode }) | null,
  children: React.ReactNode[],
  sanitized = true
): React.ReactElement | null => {
  if (typeof type === 'string' && !isValidTagName(type, sanitized)) {
    return React.createElement('div', { className: 'error' }, `Invalid tag: ${type}`);
  }

  const validatedChildren = children.map(child => {
    if (Array.isArray(child)) {
      return child.map(c => {
        if (React.isValidElement<{ children?: React.ReactNode }>(c)) {
          return ValidatedElement(
            c.type,
            c.props,
            React.Children.toArray(c.props.children),
            sanitized
          );
        }
        return isSyncNode(c) ? c : null;
      });
    }
    if (React.isValidElement<{ children?: React.ReactNode }>(child)) {
      return ValidatedElement(
        child.type,
        child.props,
        React.Children.toArray(child.props.children),
        sanitized
      );
    }
    return isSyncNode(child) ? child : null;
  });

  return React.createElement(type, props, ...validatedChildren);
};

export { ValidatedElement };
