export function debounce<T extends (...args: any[]) => any | undefined>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return function debounced(
    this: ThisParameterType<T>,
    ...parameters: Parameters<T>
  ): ReturnType<T> | undefined {
    const later = () => {
      timeoutId = undefined;
      if (!immediate) {
        return func.apply(this, parameters);
      }
      return undefined;
    };

    const callNow = immediate && !timeoutId;

    clearTimeout(timeoutId);
    timeoutId = setTimeout(later, wait);

    if (callNow) {
      return func.apply(this, parameters);
    }

    return undefined;
  };
}
