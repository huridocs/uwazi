import loadable from '@loadable/component';

import { Link } from 'react-router-dom';
import { Icon } from 'UI';
import Counter from './Counter';
import ContactForm from './ContactForm';
import { EntityData } from './EntityData';
import { EntitySection } from './EntitySection';
import EntityLink from './EntityLink';
import ItemList from './ItemList';
import Repeat from './Repeat';
import Context from './Context';
import Map from './Map';
import MarkdownLink from './MarkdownLink';
import MarkdownMedia from './MarkdownMedia';
import PayPalDonateLink from './PayPalDonateLink';
import PublicForm from './PublicForm';
import Value from './Value';
import SearchBox from './SearchBox';
import EntityInfo from './EntityInfo';

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
