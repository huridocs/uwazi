const MIN_PANE_WIDTH_PX = 320;
const SEPARATOR_PX = 4;

const minWidthForPane = (
  index: number,
  containerWidth: number,
  minRatios: readonly number[] = []
) => Math.max(MIN_PANE_WIDTH_PX, (minRatios[index] ?? 0) * containerWidth);

const fitWidthsToContainer = (widths: number[], mins: number[], containerWidth: number) => {
  let extra = widths.reduce((sum, width) => sum + width, 0) - containerWidth;
  if (extra <= 0) {
    return widths;
  }
  const next = [...widths];
  for (let index = next.length - 1; index >= 0 && extra > 0; index -= 1) {
    const reducible = Math.max(0, next[index] - mins[index]);
    const take = Math.min(reducible, extra);
    next[index] -= take;
    extra -= take;
  }
  return next;
};

const paneWidthsFromRatios = (
  ratios: number[],
  containerWidth: number,
  minRatios: readonly number[] = []
): number[] => {
  const mins = ratios.map((_, index) => minWidthForPane(index, containerWidth, minRatios));
  const fromRatios = ratios.map((percentage, index) =>
    Math.max(percentage * containerWidth, mins[index])
  );
  const total = fromRatios.reduce((sum, width) => sum + width, 0);
  if (total <= containerWidth) {
    return fromRatios;
  }
  if (minRatios.length === 0) {
    const scale = (containerWidth - (ratios.length - 1) * SEPARATOR_PX) / total;
    return fromRatios.map(width => width * scale);
  }
  return fitWidthsToContainer(fromRatios, mins, containerWidth);
};

export { MIN_PANE_WIDTH_PX, SEPARATOR_PX, minWidthForPane, paneWidthsFromRatios };
