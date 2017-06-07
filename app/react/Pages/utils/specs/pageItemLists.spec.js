/* eslint-disable max-len */

import pageLists from '../pageItemLists';

describe('Pages: pageItemLists util', () => {
  let content;

  beforeEach(() => {
    content = '## title\nSome text with a [URL](http://google.com) inside.' +
              '\n\n{list}(http://someurl:3000/es/?parameters=values)' +
              '\n\nWhich should be in its own line, "separated" with TWO line breaks (to create a new <p> Element)' +
              '\n\n{list}(http://someurl:3000/es/)' +
              '\n\nAnd should allow multiple lists with different values' +
              '\n\n{list}(https://cejil.uwazi.io/es/library/?q=(filters:(mandatos_de_la_corte:(from:1496620800)),order:asc,sort:title,types:!(%2758b2f3a35d59f31e1345b4b6%27)))' +
              '\n\n{list}(http://anotherurl:5000/es/?a=b)' +
              '\n\n```javascript\nCode\n```';
  });

  it('should extract the search URLs from the lists', () => {
    const params = pageLists.generate(content).params;
    expect(params.length).toBe(4);
    expect(params[0]).toBe('?parameters=values');
    expect(params[1]).toBe('');
    expect(params[2]).toBe('?q=(filters:(mandatos_de_la_corte:(from:1496620800)),order:asc,sort:title,types:!(%2758b2f3a35d59f31e1345b4b6%27))');
    expect(params[3]).toBe('?a=b');
  });

  it('should return the content with list placeholders', () => {
    const newContent = pageLists.generate(content).content;
    expect(newContent).toContain('{---UWAZILIST---}');
    expect(newContent).not.toContain('?parameters=values');
    expect(newContent).not.toContain('order:asc,sort:title,types:!(%2758b2f3a35d59f31e1345b4b6%27)');
  });

  it('should return empty if no content', () => {
    const listsData = pageLists.generate();
    expect(listsData.params).toEqual([]);
    expect(listsData.content).toBe('');
  });
});
