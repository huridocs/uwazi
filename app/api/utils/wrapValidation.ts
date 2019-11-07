export function wrapValidation<V extends any, M extends any>(validator: V, model: M): M {
  const wrappedModel = { ...model };
  Object.keys(wrappedModel).forEach((fnName) => {
    if (fnName in validator) {
      const modelFn = model[fnName].bind(wrappedModel);
      wrappedModel[fnName] = (...args: any[]) => {
        const res = validator[fnName](...args);
        if (res && res.then) {
          return res.then(() => modelFn(...args));
        }
        return modelFn(...args);
      };
    }
  });

  return wrappedModel;
}
