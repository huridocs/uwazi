const generateNewSafeName = (label: string) =>
  label
    .trim()
    .replace(/[#|\\|/|*|?|"|<|>|=|||\s|:|.|[|\]|%]/gi, '_')
    .replace(/^[_|\-|+|$]/, '')
    .toLowerCase();

const safeName = (label: string, newNameGeneration: boolean = false) => {
  if (newNameGeneration) {
    return generateNewSafeName(label);
  }
  return label
    .trim()
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase();
};

export { safeName };
