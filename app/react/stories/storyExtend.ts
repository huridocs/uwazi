import type { ComponentType } from 'react';

export const storyExtend = <C extends ComponentType<Record<string, unknown>>, I, E extends object>(
  story: { Component: C; extend: (input: I) => E },
  input: I
): E & { Component: C } => Object.assign(story.extend(input), { Component: story.Component });
