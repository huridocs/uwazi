import settings from 'api/settings/settings';

export default async (req, res, next) => {
  let lang = req.get('content-language');
  if (!lang && req.cookies) {
    lang = req.cookies.locale;
  }
  if (!lang && req.get('accept-language')) {
    [lang] = req.get('accept-language').split('-');
  }

  const { languages } = await settings.get();

  const langExists = languages.find(l => l.key === lang);
  if (!langExists) {
    req.language = languages.find(l => l.default).key;
  }

  if (langExists) {
    req.language = lang;
  }

  next();
};
