/* eslint-disable max-statements */
const editDistance = (text1: string, text2: string) => {
  const string1 = text1.toLowerCase();
  const string2 = text2.toLowerCase();

  const costs = [];
  for (let i = 0; i <= string1.length; i += 1) {
    let lastValue = i;
    for (let j = 0; j <= string2.length; j += 1) {
      if (i === 0) costs[j] = j;
      else if (j > 0) {
        let newValue = costs[j - 1];
        if (string1.charAt(i - 1) !== string2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[string2.length] = lastValue;
  }
  return costs[string2.length];
};

const textSimilarityCheck = (value1: string | number, value2: string | number) => {
  if (
    (!Number.isNaN(Number(value1)) || !Number.isNaN(Number(value2))) &&
    value1 !== '' &&
    value2 !== ''
  ) {
    return value1.toString() === value2.toString();
  }

  const text1 = value1.toString();
  const text2 = value2.toString();
  const longer = text1.length < text2.length ? text2 : text1;
  const shorter = text1.length < text2.length ? text1 : text2;
  const longerLength = longer.length;

  if (longerLength === 0) {
    return true;
  }

  return (longerLength - editDistance(longer, shorter)) / longerLength > 0.75;
};

export { textSimilarityCheck };
