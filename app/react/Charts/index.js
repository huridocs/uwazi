import loadable from '@loadable/component';

import { colorScheme } from './utils/colorScheme.js';
import arrayUtils from './utils/arrayUtils.js';
import { ExtendedTooltip } from './components/ExtendedTooltip.js';

const Bar = loadable(
  async () => import(/* webpackChunkName: "LazyLoadBar" */ './components/Bar.js'),
  {
    resolveComponent: m => m.Bar,
  }
);

const ColoredBar = loadable(
  async () => import(/* webpackChunkName: "LazyLoadColoredBar" */ './components/ColoredBar.js'),
  { resolveComponent: m => m.ColoredBar }
);

const Pie = loadable(
  async () => import(/* webpackChunkName: "LazyLoadPie" */ './components/Pie.js'),
  {
    resolveComponent: m => m.RechartsPie,
  }
);

const StackedDualBarChart = loadable(
  async () =>
    import(
      /* webpackChunkName: "LazyLoadStackedDualBarChart" */ './components/StackedDualBarChart.js'
    ),
  { resolveComponent: m => m.StackedDualBarChart }
);

export { Bar, ColoredBar, ExtendedTooltip, Pie, StackedDualBarChart, colorScheme, arrayUtils };
