export const term = (condition: { [k: string]: string }) => ({ term: condition });
export const terms = (condition: { [k: string]: string[] }) => ({ terms: condition });
export const bool = (condition: { [k: string]: any }) => ({ bool: condition });
export const must = (condition: object[]) => ({ must: condition });
export const nested = (condition: { path: string; query: any }) => ({ nested: condition });
export const cleanUp = (array: Array<any>) => array.filter((v: any) => v);
