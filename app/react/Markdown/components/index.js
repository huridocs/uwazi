import loadable from '@loadable/component';

import { Link } from 'react-router';
import { Icon } from '#app/UI/index.js';
import { Counter } from './Counter.js';
import { ContactForm } from './ContactForm.js';
import { EntityData } from './EntityData.js';
import { EntitySection } from './EntitySection.js';
import { EntityLink } from './EntityLink.js';
import { ItemList } from './ItemList.js';
import { Repeat } from './Repeat.js';
import { Context } from './Context.js';
import { MarkdownMap as Map } from './Map.js';
import { MarkdownLink } from './MarkdownLink.js';
import { MarkdownMedia } from './MarkdownMedia.js';
import { PayPalDonateLink } from './PayPalDonateLink.js';
import { PublicForm } from './PublicForm.js';
import { Value } from './Value.js';
import { SearchBox } from './SearchBox.js';
import { EntityInfo } from './EntityInfo.js';

const BarChart = loadable(
  () => import(/* webpackChunkName: "LazyLoadBarChart" */ './BarChart.js'),
  { resolveComponent: m => m.BarChartComponent }
);
const FreeBarChart = loadable(
  () => import(/* webpackChunkName: "LazyLoadFreeBarChart" */ './FreeBarChart.tsx'),
  { resolveComponent: m => m.FreeBarChart }
);

const Slideshow = loadable(
  () => import(/* webpackChunkName: "LazyLoadSlideshow" */ './Slideshow.js'),
  { resolveComponent: m => m.Slideshow }
);

const PieChart = loadable(
  () => import(/* webpackChunkName: "LazyLoadPieChart" */ './PieChart.js'),
  { resolveComponent: m => m.PieChart }
);

const ListChart = loadable(
  () => import(/* webpackChunkName: "LazyLoadListChart" */ './ListChart.js'),
  { resolveComponent: m => m.ListChart }
);

const GaugeChart = loadable(
  () => import(/* webpackChunkName: "LazyLoadGaugeChart" */ './GaugeChart.js'),
  { resolveComponent: m => m.GaugeChart }
);

const Dataviz = loadable(() => import(/* webpackChunkName: "LazyLoadDataviz" */ './Dataviz.tsx'), {
  resolveComponent: m => m.Dataviz,
});

export {
  MarkdownMedia,
  ContactForm,
  Context,
  EntityData,
  EntityLink,
  ItemList,
  Slideshow,
  MarkdownLink,
  PayPalDonateLink,
  PublicForm,
  SearchBox,
  Counter,
  BarChart,
  FreeBarChart,
  PieChart,
  ListChart,
  Repeat,
  GaugeChart,
  Dataviz,
  Value,
  Icon,
  Map,
  Link,
  EntityInfo,
  EntitySection,
};
