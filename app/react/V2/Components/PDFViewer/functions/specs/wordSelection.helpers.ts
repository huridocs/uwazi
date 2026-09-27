const rect = ({
  left,
  top,
  width,
  height,
}: {
  left: number;
  top: number;
  width: number;
  height: number;
}): DOMRect =>
  ({
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({}),
  }) as DOMRect;

const asRectList = (rects: DOMRect[]): DOMRectList =>
  Object.assign(rects, {
    item: (index: number) => rects[index] ?? null,
  }) as unknown as DOMRectList;

const mountLayers = (html: string) => {
  const root = document.createElement('div');
  root.innerHTML = html;
  document.body.appendChild(root);
  return root;
};

const mockFullSpanClientRects = (root: HTMLElement, spanBox: DOMRect) => {
  const region = root.querySelector('[data-region-selector-id]') as HTMLElement;
  const span = root.querySelector('span') as HTMLElement;
  jest
    .spyOn(region, 'getBoundingClientRect')
    .mockReturnValue(rect({ left: 0, top: 0, width: 200, height: 100 }));
  jest.spyOn(span, 'getBoundingClientRect').mockReturnValue(spanBox);
  Range.prototype.getClientRects = () => asRectList([spanBox]);
};

export { rect, asRectList, mountLayers, mockFullSpanClientRects };
