const compareStringLists = (list1: string[], list2: string[]): number => {
  if (list1.length !== list2.length) {
    throw new Error('The lists must have the same length.');
  }

  for (let i = 0; i < list1.length; i += 1) {
    const comparison = list1[i].localeCompare(list2[i]);
    if (comparison !== 0) return comparison;
  }

  return 0;
};

export { compareStringLists };
