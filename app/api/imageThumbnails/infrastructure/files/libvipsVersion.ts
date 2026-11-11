const MINIMUM = [8, 18, 7];

const libvipsVersionOf = (output: string): string | undefined =>
  output.match(/(\d+)\.(\d+)\.(\d+)/)?.[0];

const libvipsVersionIsUsable = (version: string): boolean => {
  const parts = version.split('.');
  if (parts.length !== 3 || parts.some(part => !/^\d+$/.test(part))) {
    return false;
  }
  const parsed = parts.map(part => Number(part));
  for (let index = 0; index < MINIMUM.length; index += 1) {
    if (parsed[index] > MINIMUM[index]) {
      return true;
    }
    if (parsed[index] < MINIMUM[index]) {
      return false;
    }
  }
  return true;
};

export { libvipsVersionIsUsable, libvipsVersionOf };
