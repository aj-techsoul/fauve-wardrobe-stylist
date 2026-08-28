import { createServer } from 'https';
import { parse } from 'url';
import next from 'next';
import selfsigned from 'selfsigned';
import fs from 'fs';
import path from 'path';

const dev = process.env.NODE_ENV !== 'production';
const PORT = 3443;
const keyPath = path.join(process.cwd(), 'server-key.pem');
const certPath = path.join(process.cwd(), 'server-cert.pem');

async function main() {
  // Generate self-signed SSL certs if not present
  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.log('🔐 Generating self-signed SSL certificates...');
    const attrs = [{ name: 'commonName', value: 'localhost' }];
    const pems = await selfsigned.generate(attrs, { days: 365, keySize: 2048 });
    fs.writeFileSync(keyPath, pems.private);
    fs.writeFileSync(certPath, pems.cert);
    console.log('✅ SSL certificates generated.');
  }

  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };

  // Serve from production .next build (dev mode requires Turbopack, unsupported on this platform)
  const app = next({ dev: false, hostname: 'localhost', port: PORT });
  const handle = app.getRequestHandler();

  await app.prepare();

  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url || '', true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Request error:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }).listen(PORT, () => {
    console.log('\n🔒 FAUVE PWA is now live on HTTPS!');
    console.log(`👉  https://localhost:${PORT}`);
    console.log('\n⚠️  Browser warning: Click "Advanced → Proceed to localhost" to accept the self-signed cert.');
    console.log('📱  Open this on your phone to install as PWA!\n');
  });
}

main().catch((err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});
