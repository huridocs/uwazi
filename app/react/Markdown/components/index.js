import loadable from '@loadable/component';

import { Link } from 'react-router';
import Icon from '#UI/Icon/Icon.js';
import Counter from '#app/Markdown/components/Counter.js';
import ContactForm from '#app/Markdown/components/ContactForm.js';
import { EntityData } from '#app/Markdown/components/EntityData.js';
import { EntitySection } from '#app/Markdown/components/EntitySection.js';
import EntityLink from '#app/Markdown/components/EntityLink.js';
import ItemList from '#app/Markdown/components/ItemList.js';
import Repeat from '#app/Markdown/components/Repeat.js';
import Context from '#app/Markdown/components/Context.js';
import Map from '#app/Markdown/components/Map.js';
import MarkdownLink from '#app/Markdown/components/MarkdownLink.js';
import MarkdownMedia from '#app/Markdown/components/MarkdownMedia.js';
import PayPalDonateLink from '#app/Markdown/components/PayPalDonateLink.js';
import PublicForm from '#app/Markdown/components/PublicForm.js';
import Value from '#app/Markdown/components/Value.js';
import SearchBox from '#app/Markdown/components/SearchBox.js';
import EntityInfo from '#app/Markdown/components/EntityInfo.js';

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
