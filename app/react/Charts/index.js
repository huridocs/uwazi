import loadable from '@loadable/component';

import colorScheme from './utils/colorScheme';
import arrayUtils from './utils/arrayUtils';
import ExtendedTooltip from './components/ExtendedTooltip';

const Bar = loadable(
  async () => import(/* webpackChunkName: "LazyLoadBar" */ './components/Bar.js')
);

const ColoredBar = loadable(
  async () => import(/* webpackChunkName: "LazyLoadColoredBar" */ './components/ColoredBar.js')
);

const Pie = loadable(
  async () => import(/* webpackChunkName: "LazyLoadPie" */ './components/Pie.js')
);

const StackedDualBarChart = loadable(
  async () =>
    import(
      /* webpackChunkName: "LazyLoadStackedDualBarChart" */ './components/StackedDualBarChart.js'
    )
);

export { Bar, ColoredBar, ExtendedTooltip, Pie, StackedDualBarChart, colorScheme, arrayUtils };
