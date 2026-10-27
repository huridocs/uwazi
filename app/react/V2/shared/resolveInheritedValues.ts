type InheritedChain<T> = {
  inheritedType?: string;
  inheritedValue?: T[];
};

const inheritedChildren = <T extends InheritedChain<T>>(values: T[]) =>
  values.flatMap(item => (Array.isArray(item.inheritedValue) ? item.inheritedValue : []));

const hasInheritedValues = <T extends InheritedChain<T>>(values: T[]) =>
  inheritedChildren(values).length > 0;

const resolveInheritedValues = <T extends InheritedChain<T>>(
  values: T[],
  inheritedType?: T['inheritedType']
): { inheritedType?: T['inheritedType']; values: T[] } => {
  const nextValues = inheritedChildren(values);
  if (!nextValues.length) {
    return { inheritedType, values };
  }

  const currentInheritedType = values.find(item => item.inheritedType)?.inheritedType;
  const nextInheritedType = nextValues.find(item => item.inheritedType)?.inheritedType;

  return resolveInheritedValues(
    nextValues,
    nextInheritedType || currentInheritedType || inheritedType
  );
};

export { hasInheritedValues, resolveInheritedValues };
