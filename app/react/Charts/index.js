import loadable from '@loadable/component';

import colorScheme, { light } from '#app/Charts/utils/colorScheme.js';
import arrayUtils from '#app/Charts/utils/arrayUtils.js';
import ExtendedTooltip from '#app/Charts/components/ExtendedTooltip.jsx';

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

export { Bar, ColoredBar, ExtendedTooltip, Pie, StackedDualBarChart, colorScheme, arrayUtils, light };
