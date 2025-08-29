import React from 'react';
import { parseDocument } from 'htmlparser2';
import { ChildNode } from 'domhandler';

type HTMLViewerProps = {
  children: string;
};

const renderNode = (node: ChildNode, key: number): React.ReactNode => {
  if (node.type === 'text') {
    return node.data;
  }
  if (node.type === 'tag') {
    const element = node;
    const props: { key: number; className: string } = { key, className: element.attribs.class };
    return React.createElement(
      element.name,
      props,
      element.children && element.children.map((child, i) => renderNode(child, i))
    );
  }
  return null;
};

const HTMLViewer = ({ children }: HTMLViewerProps) => {
  const dom = parseDocument(children);
  return <>{dom.children.map((node, i) => renderNode(node, i))}</>;
};

export { HTMLViewer };
