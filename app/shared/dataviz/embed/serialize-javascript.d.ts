declare module 'serialize-javascript' {
  type SerializeOptions = {
    isJSON?: boolean;
    unsafe?: boolean;
    ignoreFunction?: boolean;
  };

  export default function serialize(object: unknown, options?: SerializeOptions): string;
}
