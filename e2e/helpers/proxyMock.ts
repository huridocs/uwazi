/*global page*/

export default async () => {
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await page.setRequestInterception(true);
  // @ts-expect-error TS(2304): Cannot find name 'page'.
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
        // @ts-expect-error TS(7006): Parameter 'e' implicitly has an 'any' type.
        .catch(e => {
          throw e;
        });
    } else {
      // @ts-expect-error TS(7006): Parameter 'e' implicitly has an 'any' type.
      request.continue().catch(e => {
        throw e;
      });
    }
  });
};
