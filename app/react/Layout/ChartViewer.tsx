import React, { Component } from 'react';
import { connect } from 'react-redux';
import Immutable from 'immutable';

import { IStore, Property } from 'app/istore';
import { Translate } from 'app/I18N';
import { BarChart } from 'app/Markdown/components';
import { CollectionViewerProps } from './CollectionViewerProps';

interface ChartViewerProps extends CollectionViewerProps {
  chartProperties: IStore['library']['chartProperties'];
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
    const { documentTypes } = this.props.filters.toJS();
    const chartProperties = this.props.chartProperties.toJS();

    if (!chartProperties.length) {
      return (
        <div className="chartview-wrapper">
          Please select properties to render within the filters
        </div>
      );
    }

    return (
      <div className="chartview-wrapper">
        {chartProperties.map((property: Property) => (
          <div className="chartview-section" key={property._id}>
            <h3>
              <Translate context={documentTypes[0]} translationKey={property.label} />
            </h3>
            <BarChart
              property={property.name}
              data={this.props.aggregations.getIn(['all', property.name, 'buckets'])}
              colors="#337084,#00878b,#009b76,#5ba94d,#aaaf15"
              maxCategories="20"
              context={property.content}
              scatter
            />
          </div>
        ))}
      </div>
    );
  }
}

const mapStateToProps = (state: IStore) => ({
  chartProperties: state.library.chartProperties,
  aggregations: state.library.aggregations,
  filters: state.library.filters,
});

export type { ChartViewerProps };

export const ChartViewer = connect(mapStateToProps)(ChartViewerComponent);
