import React from 'react';
import { extendedHtmlTags, visualizationHtmlTags } from './utils.js';

const isValidTagName = (tagName: string, sanitized: boolean): boolean => {
  const list = !sanitized ? extendedHtmlTags : visualizationHtmlTags;
  return list.some(t => t.toLowerCase() === tagName.toLowerCase());
};

const ValidatedElement = (
  type: string | React.JSXElementConstructor<any>,
  props: (React.Attributes & { children?: React.ReactNode }) | null,
  children: React.ReactNode[],
  sanitized = true
): React.ReactElement<any> | null => {
  if (typeof type === 'string' && !isValidTagName(type, sanitized)) {
    return React.createElement('div', { className: 'error' }, `Invalid tag: ${type}`);
  }

  const validatedChildren = children.map(child => {
    if (Array.isArray(child)) {
      return child.map(c =>
        React.isValidElement<{ children?: React.ReactNode }>(c)
          ? ValidatedElement(c.type, c.props, React.Children.toArray(c.props.children), sanitized)
          : c
      );
    }
    if (React.isValidElement<{ children?: React.ReactNode }>(child)) {
      return ValidatedElement(
        child.type,
        child.props,
        React.Children.toArray(child.props.children),
        sanitized
      );
    }
    return child;
  });

  return React.createElement(type, props, ...validatedChildren);
};

export { ValidatedElement };
