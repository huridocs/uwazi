import loadable from '@loadable/component';

import { Link } from 'react-router';
import Icon from '#UI/Icon/Icon.jsx';
import Counter from '#app/Markdown/components/Counter.js';
import ContactForm from '#app/Markdown/components/ContactForm.jsx';
import { EntityData } from '#app/Markdown/components/EntityData.jsx';
import { EntitySection } from '#app/Markdown/components/EntitySection.jsx';
import EntityLink from '#app/Markdown/components/EntityLink.jsx';
import ItemList from '#app/Markdown/components/ItemList.jsx';
import Repeat from '#app/Markdown/components/Repeat.jsx';
import Context from '#app/Markdown/components/Context.jsx';
import Map from '#app/Markdown/components/Map.jsx';
import MarkdownLink from '#app/Markdown/components/MarkdownLink.jsx';
import MarkdownMedia from '#app/Markdown/components/MarkdownMedia.jsx';
import PayPalDonateLink from '#app/Markdown/components/PayPalDonateLink.jsx';
import PublicForm from '#app/Markdown/components/PublicForm.jsx';
import Value from '#app/Markdown/components/Value.jsx';
import SearchBox from '#app/Markdown/components/SearchBox.jsx';
import EntityInfo from '#app/Markdown/components/EntityInfo.jsx';

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
