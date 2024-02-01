interface CorrectSimpleLink {
  title: string;
  type: 'link';
  url: string;
}

interface CorrectGroup {
  title: string;
  type: 'group';
  url?: '';
  sublinks: CorrectSimpleLink[];
}

interface FaultyLinkOrGroup {
  title?: string;
  type?: string;
  url?: string;
  localId?: string;
  sublinks?: FaultyLinkOrGroup[];
}

type CorrectLink = CorrectSimpleLink | CorrectGroup;

type Link = CorrectSimpleLink | CorrectGroup | FaultyLinkOrGroup;

interface Settings {
  links?: Link[];
}

type Fixtures = {
  settings?: Settings[];
};

export type {
  CorrectGroup,
  CorrectLink,
  CorrectSimpleLink,
  FaultyLinkOrGroup,
  Fixtures,
  Link,
  Settings,
};
