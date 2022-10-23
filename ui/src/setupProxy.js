const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  let target = process.env.REST_API_URL;
  if (!target) {
    target = 'http://localhost:3080';
  }
  console.log('Proxying to ' + target);

  app.use(
    '/api',
    createProxyMiddleware({
      target: target,
      changeOrigin: true,
    })
  );
};
