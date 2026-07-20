import React from 'react';
import { useAtomValue } from 'jotai';
import { Tooltip as FlowbiteTooltip } from 'flowbite-react';
import { effectiveThemeModeAtom } from '#V2/atoms/index.js';

type TooltipProps = React.ComponentProps<typeof FlowbiteTooltip>;

const arrowEdges: Record<string, string> = {
  top: 'border-b border-r',
  bottom: 'border-t border-l',
  left: 'border-t border-r',
  right: 'border-t border-l',
};

const arrowStyleFor = (placement: TooltipProps['placement']) => {
  const side = (placement ?? 'top').split('-')[0] ?? 'top';
  const edges = arrowEdges[side] ?? arrowEdges.top;
  return {
    light: `bg-white ${edges} border-gray-200`,
    auto: `bg-white ${edges} border-gray-200 dark:border-gray-600 dark:bg-gray-700`,
  };
};

const defaultTheme = {
  base: 'absolute z-10 inline-block rounded-md px-2 py-1 text-[10px] font-medium leading-snug shadow-sm',
};

const Tooltip = ({ style, theme, placement = 'top', ...props }: TooltipProps) => {
  const themeMode = useAtomValue(effectiveThemeModeAtom);
  const arrowStyle = arrowStyleFor(placement);

  return (
    <FlowbiteTooltip
      placement={placement}
      style={style ?? (themeMode === 'dark' ? 'dark' : 'light')}
      theme={{
        ...defaultTheme,
        ...theme,
        arrow: {
          ...theme?.arrow,
          style: {
            ...arrowStyle,
            ...theme?.arrow?.style,
          },
        },
      }}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  );
};

export { Tooltip };
export type { TooltipProps };
