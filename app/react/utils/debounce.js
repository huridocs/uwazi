export default function debounce(func, wait, immediate) {
  let timeout;
  return function () {
    let args = arguments;
    let later = () => {
      timeout = null;
      if (!immediate) {
        return func.apply(this, args);
      }
    };
    let callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) {
      return func.apply(this, args);
    }
  };
}
