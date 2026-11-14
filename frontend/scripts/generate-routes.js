import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

const routes = [
  'dashboard',
  'global-explorer',
  'fire-map',
  'calendar',
  'time-machine',
  'comparison',
  'country-comparison',
  'trends',
  'insights',
  'coverage',
  'data-sources',
  'about',
  'settings'
];

if (fs.existsSync(distDir)) {
  const indexHtmlPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    // 404 fallback
    fs.copyFileSync(indexHtmlPath, path.join(distDir, '404.html'));

    // Route directories for direct deep-link navigation
    for (const r of routes) {
      const targetDir = path.join(distDir, r);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      fs.copyFileSync(indexHtmlPath, path.join(targetDir, 'index.html'));
    }
    console.log(`[generate-routes] Created static HTML fallbacks for ${routes.length} routes.`);
  }
}
