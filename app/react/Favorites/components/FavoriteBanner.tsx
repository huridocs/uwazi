import React, { Component } from 'react';
import { Translate } from 'app/I18N';
export type FavoriteBannerProps = {
  sharedId: string;
};

export type FavoriteBannerState = {
  selected: boolean;
};

const getUwaziFavorites = () =>
  localStorage.getItem('uwaziFavorites') ? localStorage.getItem('uwaziFavorites')!.split(',') : [];

class FavoriteBanner extends Component<FavoriteBannerProps, FavoriteBannerState> {
  constructor(props: FavoriteBannerProps) {
    super(props);
    this.state = { selected: false };
    this.toggleClick = this.toggleClick.bind(this);
  }

  componentDidMount() {
    const { sharedId } = this.props;
    const shouldBeSelected = getUwaziFavorites().includes(sharedId);
    if (shouldBeSelected) {
      this.setState({ selected: shouldBeSelected });
    }
  }

  toggleClick(e: any) {
    const { sharedId } = this.props;
    const uwaziFavorites = getUwaziFavorites();
    e.stopPropagation();
    e.preventDefault();
    if (uwaziFavorites.includes(sharedId)) {
      const itemIndex = uwaziFavorites.indexOf(sharedId);
      uwaziFavorites.splice(itemIndex, 1);
    } else {
      uwaziFavorites.push(sharedId);
    }
    localStorage.setItem('uwaziFavorites', uwaziFavorites.join(','));
    this.setState({ selected: getUwaziFavorites().includes(sharedId) });
  }

  render() {
    const { selected } = this.state;

    return (
      <button
        className={`btn favoriteBanner ${selected ? 'selected' : ''}`}
        onClick={this.toggleClick}
        type="button"
        suppressHydrationWarning
      >
        <span className="tab-link-tooltip">
          <Translate>Add / remove favorite</Translate>
        </span>
      </button>
    );
  }
}

export { FavoriteBanner };
