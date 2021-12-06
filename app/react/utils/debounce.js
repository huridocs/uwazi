export default function debounce(func, wait, immediate) {
  let timeout;

  return function () {
    const args = arguments;
    const later = () => {
      timeout = null;
      if (!immediate) {
        return func.apply(this, args);
      }
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) {
      return func.apply(this, args);
    }
  };
}
