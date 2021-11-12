describe('check mappings', () => {
  it('should check if a template is valid vs the current elasticsearch mapping', async () => {
    const req = {
      body: { _id: db.id(), name: 'my template', properties: [] },
      socket: mocketSocketIo(),
    };
    const result = await routes.post('/api/templates', req);
    console.log(('result: ', result));
    // expect(result).toEqual({ errors: [], valid: true });
  });
});
