import loadable from '@loadable/component';

import { colorScheme } from './utils/colorScheme.js';
import arrayUtils from './utils/arrayUtils.js';
import { ExtendedTooltip } from './components/ExtendedTooltip.js';

const Bar = loadable(() => import(/* webpackChunkName: "LazyLoadBar" */ './components/Bar.js'), {
  resolveComponent: m => m.Bar,
});

const ColoredBar = loadable(
  () => import(/* webpackChunkName: "LazyLoadColoredBar" */ './components/ColoredBar.js'),
  { resolveComponent: m => m.ColoredBar }
);

const Pie = loadable(() => import(/* webpackChunkName: "LazyLoadPie" */ './components/Pie.js'), {
  resolveComponent: m => m.RechartsPie,
});

const StackedDualBarChart = loadable(
  () =>
    import(
      /* webpackChunkName: "LazyLoadStackedDualBarChart" */ './components/StackedDualBarChart.js'
    ),
  { resolveComponent: m => m.StackedDualBarChart }
);

export { Bar, ColoredBar, ExtendedTooltip, Pie, StackedDualBarChart, colorScheme, arrayUtils };
