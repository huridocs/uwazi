export function wrapValidation<V, M>(validator: V, model: M): M {
  const wrappedModel = { ...model };
  Object.keys(wrappedModel).forEach((fn) => {
    if (fn in validator) {
      // @ts-ignore
      wrappedModel[fn] = (...args) => {
        // @ts-ignore
        validator[fn](...args);
        // @ts-ignore
        return model[fn](...args);
      };
    }
  });

  return wrappedModel;
}
