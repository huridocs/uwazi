import { deepEquals } from './deepEquals';

type PropNameType = string | number;

type PropObject = { [k in PropNameType]: any };

type ShallowDiffResult = {
  isDifferent: boolean;
  missing: PropNameType[];
  extra: PropNameType[];
  differentValue: PropNameType[];
};

const shallowObjectDiff = (left: PropObject, right: PropObject): ShallowDiffResult => {
  const leftProps = new Set(Object.keys(left));
  const rightProps = new Set(Object.keys(right));
  const missing = Object.keys(left).filter(p => !rightProps.has(p));
  const extra = Object.keys(right).filter(p => !leftProps.has(p));
  const inBoth = Object.keys(left).filter(p => rightProps.has(p));
  const differentValue = inBoth.filter(p => !deepEquals(left[p], right[p]));
  return {
    isDifferent: !!missing.length || !!extra.length || !!differentValue.length,
    missing,
    extra,
    differentValue,
  };
};

export { shallowObjectDiff };
