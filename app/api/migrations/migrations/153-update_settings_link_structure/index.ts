import { Db } from 'mongodb';
import {
  CorrectGroup,
  CorrectLink,
  CorrectSimpleLink,
  FaultyLinkOrGroup,
  Link,
  Settings,
} from './types';

type Categories = 'link' | 'group';

const categorizeLink = (link: Link): Categories => {
  if (link.type === 'link' || link.type === 'group') {
    return link.type;
  }
  if ('sublinks' in Object.keys(link)) {
    return 'group';
  }
  if (link.url === '') {
    return 'group';
  }
  return 'link';
};

const repairSimpleLink = (link: Link): CorrectSimpleLink | null => {
  if (!link.title || !link.url) {
    return null;
  }
  return {
    title: link.title,
    type: 'link',
    url: link.url,
  };
};

const repairGroup = (group: Link): CorrectGroup | null => {
  if (!group.title) {
    return null;
  }
  // @ts-ignore
  const originalSublinks: FaultyLinkOrGroup[] = group.sublinks || [];
  const sublinks: CorrectSimpleLink[] = [];
  originalSublinks.forEach(sublink => {
    const repairedSublink = repairSimpleLink(sublink);
    if (repairedSublink) {
      sublinks.push(repairedSublink);
    }
  });

  return {
    title: group.title,
    type: 'group',
    url: '',
    sublinks,
  };
};

const repairLinks = (links: Link[]): CorrectLink[] => {
  const repairedLinks: CorrectLink[] = [];
  links.forEach(link => {
    const category = categorizeLink(link);
    let repaired: CorrectLink | null = null;
    if (category === 'link') repaired = repairSimpleLink(link);
    if (category === 'group') repaired = repairGroup(link);
    if (repaired) repairedLinks.push(repaired);
  });
  return repairedLinks;
};

export default {
  delta: 153,

  name: 'update_settings_link_structure',

  description:
    'After the changes in the V2 settings UI, the links and sublinks in the settings need to be updated (add missing types, remove localIds).',

  reindex: false,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    const [settings] = await db.collection<Settings>('settings').find({}).toArray();
    const originalLinks = settings.links || [];

    const repairedLinks = repairLinks(originalLinks);

    await db
      .collection<Settings>('settings')
      .updateOne({ _id: settings._id }, { $set: { links: repairedLinks } });
  },
};
