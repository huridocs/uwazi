import path from 'path';
import rtlcss from 'rtlcss';

const createHotRtlCssHandler = ({ waitUntilValid, outputFileSystem, outputPath }) => {
  return (req, res, next) => {
    if (req.query.rtl !== 'true') {
      next();
      return;
    }

    const filename = `CSS/${req.params.file}`;

    waitUntilValid(() => {
      try {
        const filePath = path.join(outputPath, filename);
        if (!outputFileSystem?.existsSync?.(filePath)) {
          next();
          return;
        }

        const file = outputFileSystem.readFileSync(filePath, 'utf8');
        res.setHeader('Content-Type', 'text/css');
        res.end(rtlcss.process(file));
      } catch (error) {
        next(error);
      }
    });
  };
};

const registerHotWebpackRoutes = (
  app,
  { rtlCssHandler, webpackDevMiddleware, webpackHotMiddleware }
) => {
  app.get('/CSS/:file', rtlCssHandler);
  app.use(webpackDevMiddleware);
  app.use(webpackHotMiddleware);
};

export { createHotRtlCssHandler, registerHotWebpackRoutes };
