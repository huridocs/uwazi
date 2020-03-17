import React, { Component } from 'react';
import { isClient } from 'app/utils';

export type FavoriteBannerProps = {
  sharedId: string;
};

const getUwaziFavorites = () =>
  localStorage.getItem('uwaziFavorites') ? localStorage.getItem('uwaziFavorites')?.split(',') : [];

class FavoriteBanner extends Component<FavoriteBannerProps> {
  constructor(props: FavoriteBannerProps) {
    super(props);
    this.toggleClick = this.toggleClick.bind(this);
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
    this.forceUpdate();
  }

  render() {
    if (isClient) {
      const { sharedId } = this.props;
      const selected = getUwaziFavorites().includes(sharedId);

      return (
        <button
          className={`favoriteBanner ${selected ? 'selected' : ''}`}
          onClick={this.toggleClick}
          type="button"
        />
      );
    }

    return null;
  }
}

export default FavoriteBanner;
