import ImmutableModule from 'immutable';

const Immutable =
  (typeof ImmutableModule?.fromJS === 'function' ? ImmutableModule : ImmutableModule?.default) ||
  ImmutableModule;

export { Immutable };
export default Immutable;
