import type { ComponentType } from 'react';

const composeComponent = <C>(story: object): C => {
  const compose = Object.getOwnPropertyDescriptor(story, '__compose')?.value;
  if (typeof compose !== 'function') {
    throw new Error('storyExtend: extended story is missing __compose');
  }
  return compose.call(story);
};

export const storyExtend = <C extends ComponentType<Record<string, unknown>>, I, E extends object>(
  story: { Component: C; extend: (input: I) => E },
  input: I
): E & { Component: C } => {
  const extended = story.extend(input);
  return Object.assign(extended, { Component: composeComponent<C>(extended) });
};
