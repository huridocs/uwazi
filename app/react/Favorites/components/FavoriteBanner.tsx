import React, { Component } from 'react';

export type FavoriteBannerProps = {
  sharedId: string;
};

const getUwaziFavorites = () => (localStorage.getItem('uwaziFavorites') || '').split(',');

class FavoriteBanner extends Component<FavoriteBannerProps> {
  constructor(props: FavoriteBannerProps) {
    super(props);
    this.toggleClick = this.toggleClick.bind(this);
  }

  toggleClick() {
    const { sharedId } = this.props;
    const uwaziFavorites = getUwaziFavorites();

    if (uwaziFavorites.includes(sharedId)) {
      const itemIndex = uwaziFavorites.indexOf(sharedId);
      uwaziFavorites.splice(itemIndex, 1);
      localStorage.setItem('uwaziFavorites', uwaziFavorites.join(','));
      this.forceUpdate();
    } else {
      localStorage.setItem('uwaziFavorites', `${uwaziFavorites.join(',')},${sharedId}`);
      this.forceUpdate();
    }
  }

  render() {
    const { sharedId } = this.props;
    const selected = getUwaziFavorites().includes(sharedId);

    return (
      <div className={`favoriteBanner ${selected ? 'selected' : ''}`} onClick={this.toggleClick}>
        Component
      </div>
    );
  }
}

export default FavoriteBanner;
