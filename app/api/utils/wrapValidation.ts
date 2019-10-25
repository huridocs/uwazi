export function wrapValidation<V extends any, M extends any>(validator: V, model: M): M {
  const wrappedModel = { ...model };
  Object.keys(wrappedModel).forEach((fnName) => {
    if (fnName in validator) {
      wrappedModel[fnName] = (...args: any[]) => {
        const validatorFn = validator[fnName].bind(validator);
        const res = validatorFn(...args);
        if (res && res.then) {
          return res.then(() => model[fnName](...args));
        }
        return model[fnName](...args);
      };
    }
  });

  return wrappedModel;
}
