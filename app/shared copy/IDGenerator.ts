const limitedLength = (length: number) => Math.max(0, Math.min(13, length));
const generateID = (characterLength: number, numericLength: number, extraLength: number = 0) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const randomString = (options: string, outputLength: number) =>
    [...Array(outputLength)]
      .map((_v, _i) => options.charAt(Math.floor(Math.random() * options.length)))
      .join('');
  const characterPart = randomString(characters, limitedLength(characterLength));
  const numericPart = randomString(numbers, limitedLength(numericLength));
  const timestamp = Date.now().toString();
  const extraPart =
    extraLength > 0
      ? `-${timestamp.substr(timestamp.length - limitedLength(extraLength), timestamp.length)}`
      : '';
  return characterPart + numericPart + extraPart;
};

export { generateID };
