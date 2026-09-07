// Vercel Serverless Entry Point - CommonJS wrapper untuk ESM app
// Menggunakan dynamic import() karena server/src/app.js adalah ESM (type: module)
module.exports = async (req, res) => {
  const { default: app } = await import('../server/src/app.js');
  return app(req, res);
};
