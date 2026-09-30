import type { PaneProps } from './types.js';

const isPane = (node: React.ReactNode): node is React.ReactElement<PaneProps> =>
  typeof node === 'object' && node !== null && 'props' in node;

const flattenPanes = (nodes: React.ReactNode): React.ReactElement<PaneProps>[] => {
  if (Array.isArray(nodes)) return nodes.flatMap(flattenPanes);
  return isPane(nodes) ? [nodes] : [];
};

export { flattenPanes };
