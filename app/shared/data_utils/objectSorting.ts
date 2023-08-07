import { compareStringLists } from './stringUtils';

const sortByStrings = <T>(arr: T[], stringIndices: ((obj: T) => string)[]) => {
  const compare = (a: any, b: any) => {
    const aList = stringIndices.map(index => index(a));
    const bList = stringIndices.map(index => index(b));
    return compareStringLists(aList, bList);
  };

  return arr.sort(compare);
};

export { sortByStrings };
