const CanvasContext = Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: () => ({
    save() {},
    restore() {},
    stroke() {},
    translate() {},
    scale() {},
    rotate() {},
    fill() {},
    transform() {},
    rect() {},
    clip() {},
  }),
});

export { CanvasContext };
