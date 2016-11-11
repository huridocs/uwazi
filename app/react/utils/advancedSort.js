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

const compare = (baseA, baseB, options) => {
  const a = options.order === 'desc' ? baseB : baseA;
  const b = options.order === 'desc' ? baseA : baseB;

  if (options.treatAs === 'number') {
    return Number(a) - Number(b);
  }

  if (options.treatAs === 'dottedList') {
    return compareDottedList(a, b, options);
  }

  return localCompare(a, b);
};

const evalIfHasProperty = (data, property) => {
  return typeof data === 'object' && data !== null && Object.keys(data).indexOf(property) !== -1;
};

export default {
  advancedSort: (array, options = {}) => {
    options.order = options.order || 'asc';
    const sortedArray = copyArray(array);

    if (options.property) {
      sortedArray.sort((baseA, baseB) => {
        let a;
        let b;

        if (!Array.isArray(options.property)) {
          a = baseA[options.property];
          b = baseB[options.property];
        }

        if (Array.isArray(options.property)) {
          a = options.property.reduce((memo, property) => {
            return evalIfHasProperty(memo, property) ? memo[property] : null;
          }, baseA);
          b = options.property.reduce((memo, property) => {
            return evalIfHasProperty(memo, property) ? memo[property] : null;
          }, baseB);
        }

        if (!a) {
          return 1;
        }
        if (!b) {
          return -1;
        }
        return compare(a, b, options);
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
