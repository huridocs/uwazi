import _ from 'lodash';

type PropNameType = string;

type PropObject = { [k in PropNameType]: any };

type ShallowDiffResult = {
  isDifferent: boolean;
  missing: PropNameType[];
  extra: PropNameType[];
  differentValue: PropNameType[];
  all: PropNameType[];
};

const shallowObjectDiff = (left: PropObject, right: PropObject): ShallowDiffResult => {
  const leftProps = new Set(Object.keys(left));
  const rightProps = new Set(Object.keys(right));
  const missing = Object.keys(left).filter(p => !rightProps.has(p));
  const extra = Object.keys(right).filter(p => !leftProps.has(p));
  const inBoth = Object.keys(left).filter(p => rightProps.has(p));
  const differentValue = inBoth.filter(p => !_.isEqual(left[p], right[p]));
  const all = missing.concat(extra, differentValue);
  return {
    isDifferent: !!all.length,
    missing,
    extra,
    differentValue,
    all,
  };
};

export { shallowObjectDiff };
