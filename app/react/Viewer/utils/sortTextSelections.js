export default (a, b) =>
  a.selectionRectangles[0].regionId === b.selectionRectangles[0].regionId
    ? a.selectionRectangles[0].top - b.selectionRectangles[0].top
    : a.selectionRectangles[0].regionId - b.selectionRectangles[0].regionId;
