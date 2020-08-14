/*global page*/

export default async () => {
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (
      request.url() ===
      'https://fonts.googleapis.com/css?family=Roboto+Mono:100,300,400,500,700|Roboto+Slab:100,300,400,700|Roboto:100,300,400,500,700,900'
    ) {
      request
        .respond({
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify(''),
        })
        .catch(e => {
          throw e;
        });
    } else {
      request.continue().catch(e => {
        throw e;
      });
    }
  });
};
