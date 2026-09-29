const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isUnknownFn = (value: unknown): value is (...args: unknown[]) => unknown =>
  typeof value === 'function';

const enzymeProps = (node: unknown): Record<string, unknown> =>
  isRecord(node) && isRecord(node.props) ? node.props : {};

const enzymeAt = (node: unknown, index: number): unknown => {
  const { children } = enzymeProps(node);
  return Array.isArray(children) ? children[index] : undefined;
};

const enzymeFn = (value: unknown) => {
  if (!isUnknownFn(value)) {
    throw new Error('Expected a function prop');
  }
  return value;
};

export { enzymeAt, enzymeFn, enzymeProps, isRecord };
