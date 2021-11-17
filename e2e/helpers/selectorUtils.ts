const getContentBySelector = async (selector: string) =>
  page.$$eval(selector, items => items.map(item => item.textContent));

export { getContentBySelector };
