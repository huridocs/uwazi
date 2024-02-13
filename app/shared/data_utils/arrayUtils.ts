function explicitOrdering(orderArray: string[], inputArray: string[], strict: boolean): string[] {
  const orderSet = new Set(orderArray);
  const inputSet = new Set(inputArray);

  if (strict) {
    const invalidElements = [...inputSet].filter(element => !orderSet.has(element));

    if (invalidElements.length > 0) {
      throw new Error(`Invalid elements found in ordering - ${invalidElements.join(', ')}`);
    }
  }

  const arrangedArray = orderArray.filter(element => inputSet.has(element));

  if (!strict) {
    const nonexistingElements = [...inputSet].filter(element => !orderSet.has(element));
    arrangedArray.push(...nonexistingElements);
  }

  return arrangedArray;
}

function isUnique(arr: (string | number)[]): boolean {
  const uniqueSet = new Set(arr);
  return uniqueSet.size === arr.length;
}

export { explicitOrdering, isUnique };
