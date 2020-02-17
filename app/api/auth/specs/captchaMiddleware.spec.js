import captchaMiddleware from '../captchaMiddleware';

describe('captchaMiddleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { body: {}, session: {} };
    res = {
      status: jasmine.createSpy('status'),
      json: jasmine.createSpy('json'),
    };
    next = jasmine.createSpy('next');
  });

  it('should return an error when there is no captcha in the request', () => {
    const middleWare = captchaMiddleware();
    middleWare(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Captcha error', message: 'Forbidden' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return an error when the captcha does not match', () => {
    const middleWare = captchaMiddleware();
    req.body.captcha = '123';
    req.session.captcha = '456';
    middleWare(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Captcha error', message: 'Forbidden' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next when the captcha matches', () => {
    const middleWare = captchaMiddleware();
    req.body.captcha = '123';
    req.session.captcha = '123';
    middleWare(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('should delete the captcha from the body', () => {
    const middleWare = captchaMiddleware();
    req.body.captcha = '123';
    req.session.captcha = '123';
    middleWare(req, res, next);

    expect(req.body.captcha).not.toBeDefined();
  });
});
