import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  publicDir: '../public',
  plugins: [react()],
  resolve: {dedupe: ['react', 'react-dom', 'remotion']},
  server: {host: '127.0.0.1', fs: {allow: [fileURLToPath(new URL('..', import.meta.url))]}},
  worker: {format: 'es'},
  build: {copyPublicDir: false},
});
