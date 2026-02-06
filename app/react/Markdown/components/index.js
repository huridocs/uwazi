import loadable from '@loadable/component';

import { Link } from 'react-router';
import { Icon } from '#app/UI/index.js';
import Counter from './Counter.js';
import ContactForm from './ContactForm.js';
import { EntityData } from './EntityData.js';
import { EntitySection } from './EntitySection.js';
import EntityLink from './EntityLink.js';
import ItemList from './ItemList.js';
import Repeat from './Repeat.js';
import Context from './Context.js';
import Map from './Map.js';
import MarkdownLink from './MarkdownLink.js';
import MarkdownMedia from './MarkdownMedia.js';
import PayPalDonateLink from './PayPalDonateLink.js';
import PublicForm from './PublicForm.js';
import Value from './Value.js';
import SearchBox from './SearchBox.js';
import EntityInfo from './EntityInfo.js';

const BarChart = loadable(
  async () => import(/* webpackChunkName: "LazyLoadBarChart" */ './BarChart.js')
);
const FreeBarChart = loadable(
  async () => import(/* webpackChunkName: "LazyLoadFreeBarChart" */ './FreeBarChart.tsx')
);

const Slideshow = loadable(
  async () => import(/* webpackChunkName: "LazyLoadSlideshow" */ './Slideshow.js')
);

const PieChart = loadable(
  async () => import(/* webpackChunkName: "LazyLoadPieChart" */ './PieChart.js')
);

const ListChart = loadable(
  async () => import(/* webpackChunkName: "LazyLoadListChart" */ './ListChart.js')
);
const GaugeChart = loadable(
  async () => import(/* webpackChunkName: "LazyLoadGaugeChart" */ './GaugeChart.js')
);

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
  Value,
  Icon,
  Map,
  Link,
  EntityInfo,
  EntitySection,
};
