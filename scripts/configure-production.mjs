import { writeFileSync } from 'node:fs';

const apiUrl = process.env.API_URL?.trim().replace(/\/+$/, '');

if (!apiUrl) {
  throw new Error('API_URL is required to configure the production build.');
}

const apiBaseUrl = new URL('/api/v1', `${apiUrl}/`).toString().replace(/\/$/, '');
const source = `export const environment = {
  production: true,
  apiBaseUrl: ${JSON.stringify(apiBaseUrl)}
};
`;

writeFileSync(new URL('../src/environments/environment.production.ts', import.meta.url), source);
console.log(`Configured production API endpoint: ${apiBaseUrl}`);
