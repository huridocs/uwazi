type InheritedChain<T> = {
  inheritedType?: string;
  inheritedValue?: T[];
};

const inheritedChildren = <T extends InheritedChain<T>>(values: T[]) =>
  values.flatMap(item => (Array.isArray(item.inheritedValue) ? item.inheritedValue : []));

const hasInheritedValues = <T extends InheritedChain<T>>(values: T[]) =>
  inheritedChildren(values).length > 0;

const walkInheritedValues = <T extends InheritedChain<T>>(
  values: T[],
  inheritedType: T['inheritedType'] | undefined,
  seen: WeakSet<object>
): { inheritedType?: T['inheritedType']; values: T[] } => {
  values.forEach(item => seen.add(item));
  const nextValues = inheritedChildren(values).filter(item => !seen.has(item));
  if (!nextValues.length) {
    return { inheritedType, values };
  }

  const currentInheritedType = values.find(item => item.inheritedType)?.inheritedType;
  const nextInheritedType = nextValues.find(item => item.inheritedType)?.inheritedType;

  return walkInheritedValues(
    nextValues,
    nextInheritedType || currentInheritedType || inheritedType,
    seen
  );
};

const resolveInheritedValues = <T extends InheritedChain<T>>(
  values: T[],
  inheritedType?: T['inheritedType']
): { inheritedType?: T['inheritedType']; values: T[] } =>
  walkInheritedValues(values, inheritedType, new WeakSet());

export { hasInheritedValues, resolveInheritedValues };
