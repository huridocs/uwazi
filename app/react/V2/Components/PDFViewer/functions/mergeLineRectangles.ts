import type { SelectionRectangle } from '@huridocs/react-text-selection-handler';

const LINE_TOLERANCE_PX = 4;

const sameLine = (left: SelectionRectangle, right: SelectionRectangle) =>
  left.regionId === right.regionId && Math.abs(left.top - right.top) <= LINE_TOLERANCE_PX;

const mergePair = (base: SelectionRectangle, next: SelectionRectangle): SelectionRectangle => {
  const left = Math.min(base.left, next.left);
  const top = Math.min(base.top, next.top);
  const right = Math.max(base.left + base.width, next.left + next.width);
  const bottom = Math.max(base.top + base.height, next.top + next.height);
  return {
    left,
    top,
    width: right - left,
    height: bottom - top,
    regionId: base.regionId,
  };
};

const mergeLineRectangles = (rectangles: SelectionRectangle[]): SelectionRectangle[] => {
  const ordered = [...rectangles].sort((left, right) => {
    if (left.regionId !== right.regionId) {
      return (left.regionId || '').localeCompare(right.regionId || '');
    }
    if (Math.abs(left.top - right.top) > LINE_TOLERANCE_PX) {
      return left.top - right.top;
    }
    return left.left - right.left;
  });

  return ordered.reduce<SelectionRectangle[]>((groups, rectangle) => {
    const current = groups[groups.length - 1];
    if (current && sameLine(current, rectangle)) {
      groups[groups.length - 1] = mergePair(current, rectangle);
      return groups;
    }
    groups.push({ ...rectangle });
    return groups;
  }, []);
};

export { mergeLineRectangles };
