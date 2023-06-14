import React, { Component } from 'react';
import { connect } from 'react-redux';
import Immutable from 'immutable';

import { IStore } from 'app/istore';
import { t } from 'app/I18N';
import { BarChart } from 'app/Markdown/components';
import { CollectionViewerProps } from './CollectionViewerProps';

interface ChartViewerProps extends CollectionViewerProps {
  aggregations: Immutable.List<{}>;
  filters: IStore['library']['filters'];
}

interface ChartViewerSate {
  property: string;
}

class ChartViewerComponent extends Component<ChartViewerProps, ChartViewerSate> {
  static wrapLoader = true;

  constructor(props: ChartViewerProps) {
    super(props);
    this.state = { property: '' };
    // this.handleSubmit = this.handleSubmit.bind(this);
    // this.loadMore = this.loadMore.bind(this);
  }

  render() {
    const { properties, documentTypes } = this.props.filters.toJS();

    // properties.forEach(p => {
    //   console.log(p.label, t(documentTypes[0], p.label, null, false));
    // });

    return (
      <div className="chartview-wrapper">
        <div className="property-selector">
          <label htmlFor="property">Property:</label>

          <select name="property" id="chartProperty">
            <option value="" disabled selected={this.state.property === ''}>
              Select property to chart
            </option>
            {properties
              .filter(p => ['multiselect', 'select'].includes(p.type))
              .map(p => (
                <option value={p.name} key={p._id}>
                  {t(documentTypes[0], p.label, null, false)}
                </option>
              ))}
          </select>
        </div>
        <BarChart
          property="lokasi_kejadian"
          data={this.props.aggregations.getIn(['all', 'lokasi_kejadian', 'buckets'])}
          colors="#337084,#00878b,#009b76,#5ba94d,#aaaf15"
          maxCategories={20}
          context="63b41524e5314363ba359ef5"
          // scatter
        />
      </div>
    );
  }
}

const mapStateToProps = (state: IStore) =>
  //state: IStore, props: ChartViewerProps
  ({
    aggregations: state.library.aggregations,
    filters: state.library.filters,
  });

export type { ChartViewerProps };

export const ChartViewer = connect(mapStateToProps)(ChartViewerComponent);
