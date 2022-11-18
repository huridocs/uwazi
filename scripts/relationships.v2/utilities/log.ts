const print = (text: string) => process.stdout.write(text);
const println = (text: string) => print(text+'\n');

export { print, println };