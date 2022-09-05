import React, { ReactElement, Component } from 'react';

interface StickyHeaderProps {
  children: ReactElement;
  scrollElementSelector: string;
}

class StickyHeader extends Component<StickyHeaderProps, {}> {
  element: Element | null = null;

  constructor(props: StickyHeaderProps) {
    super(props);
    this.onElementScroll = this.onElementScroll.bind(this);
  }

  componentDidMount() {
    this.element = document.querySelector(this.props.scrollElementSelector);
    if (this.element) {
      console.log(this.element);
      this.element.addEventListener('onscroll', () => console.log('Scrolled...'));
    }
  }

  componentWillUnmount(): void {
    this.element?.removeEventListener('onscroll', () => console.log('Scrolled...'));
  }

  // eslint-disable-next-line class-methods-use-this
  onElementScroll(event: Event) {
    console.log('Scroll has happened...', event);
  }

  render() {
    return <>{this.props.children}</>;
  }
}

export { StickyHeader };
