const debounce = <T>(func: (...args: any) => T, wait: number, immediate?: boolean) => {
  let timeoutId: undefined | ReturnType<typeof setTimeout>;

  return (...parameters: any) => {
    const args = parameters;

    const later = () => {
      timeoutId = undefined;

      if (!immediate) {
        return func.apply(this, args);
      }

      return undefined;
    };

    const callNow = immediate && !timeoutId;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(later, wait);

    if (callNow) {
      return func.apply(this, args);
    }

    return undefined;
  };
};

export { debounce };
