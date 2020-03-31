describe('Entities', () => {
  beforeAll(async () => {
    await page.setRequestInterception(true);
    page.on('request', request => {
        if (request.url() === "https://fonts.googleapis.com/css?family=Roboto+Mono:100,300,400,500,700|Roboto+Slab:100,300,400,700|Roboto:100,300,400,500,700,900") {
            request.respond({
                content: 'application/json',
                headers: {"Access-Control-Allow-Origin": "*"},
                body: JSON.stringify("")
            });
        }
        else {
            request.continue();
        }
    });

    function delay(time) {
       return new Promise(function(resolve) {
           setTimeout(resolve, time)
       });
    }
    // await delay(4000);

    await page.setViewport({ width: 1300, height: 800});
  });

  it('Should login as admin', async () => {
    await page.goto('http://localhost:3000');
    await expect(page).toClick('a', { text: 'Sign in' })
    await expect(page).toFill('input[name=username]', 'admin')
    await expect(page).toFill('input[name=password]', 'admin')
    await expect(page).toClick('button', { text: 'Login' })
    await expect(page).toMatchElement("span", {class: 'translation', text: 'Account settings'})
  });

  it('Should create new entity', async () => {
    await expect(page).toClick('a', { text: 'Private documents' })
    await expect(page).toClick('button', { text: 'New entity' })
    await expect(page).toFill('textarea[name="uploads.sidepanel.metadata.title"]', 'Test title')
    await expect(page).toMatchElement("button", {type: 'submit', text: 'Save'})
    await expect(page).toClick('button', { text: 'Save' })
  });
});
