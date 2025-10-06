// setupProxy.js - Proxy Ollama requests during local development

const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function setupProxy(app) {
  const target = process.env.OLLAMA_BASE_URL || 'https://ollama.vps.iameternalzion.com';

  app.use(
    '/ollama',
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        '^/ollama': '/api'
      },
      logLevel: 'warn'
    })
  );
};
