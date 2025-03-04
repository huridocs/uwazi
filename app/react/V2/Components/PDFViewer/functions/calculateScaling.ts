const calculateScaling = (pageWidth: number, containerWidth: number | undefined) => {
  const container = containerWidth || pageWidth;
  const scale = container / pageWidth;
  return scale;
};

export { calculateScaling };
