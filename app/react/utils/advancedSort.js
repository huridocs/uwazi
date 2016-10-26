const copyArray = (array) => {
  return array.concat();
};

const localCompare = (a, b) => {
  return a.toLowerCase().localeCompare(b.toLowerCase());
};

const compareDottedList = (a, b, options) => {
  const aParts = a.split('.');
  const bParts = b.split('.');

  const compareArray = options.listTypes.reduce((memo, type, index) => {
    if (aParts.length > index && bParts.length <= index) {
      memo.push(1);
      return memo;
    }

    if (aParts.length <= index && bParts.length > index) {
      memo.push(-1);
      return memo;
    }

    if (aParts.length > index && bParts.length > index) {
      const x = type(aParts[index]);
      const y = type(bParts[index]);
      if (x !== y) {
        memo.push(x < y ? -1 : 1);
        return memo;
      }
    }

    memo.push(0);
    return memo;
  }, []);

  return compareArray.reduce((memo, indexCompare) => {
    return !memo && indexCompare ? indexCompare : memo;
  }, 0);
};

const compare = (a, b, options) => {
  if (options.treatAs === 'number') {
    return Number(a) - Number(b);
  }

  if (options.treatAs === 'dottedList') {
    return compareDottedList(a, b, options);
  }

  return localCompare(a, b);
};

export default {
  advancedSort: (array, options = {}) => {
    const sortedArray = copyArray(array);

    if (options.property) {
      sortedArray.sort((a, b) => {
        if (!a[options.property]) {
          return 1;
        }
        if (!b[options.property]) {
          return -1;
        }
        return compare(a[options.property], b[options.property], options);
      });
    }

    if (!options.property) {
      sortedArray.sort((a, b) => {
        return compare(a, b, options);
      });
    }

    return sortedArray;
  }
};
