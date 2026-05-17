const http = require('http');
function fetch(path) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port: 3000, path }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
}
(async () => {
  try {
    const page = await fetch('/worker-profiles.html');
    console.log('PAGE', page.status);
    console.log('---');
    const api = await fetch('/api/marketplace/workers');
    console.log('API', api.status);
    console.log(api.body.slice(0, 400));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
