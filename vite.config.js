import { defineConfig } from 'vite';
import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';

export default defineConfig({
  root: '.',
  publicDir: 'assets',
  plugins: [
    (() => {
      let outDir = 'dist';
      return {
        name: 'copy-static-scripts',
        configResolved(config) {
          outDir = config.build.outDir || 'dist';
        },
        async closeBundle() {
          const files = [
            { src: 'scripts/app.js', dest: path.join(outDir, 'scripts', 'app.js') },
            { src: 'scripts/data/sections.json', dest: path.join(outDir, 'scripts', 'data', 'sections.json') }
          ];
          for (const file of files) {
            await mkdir(path.dirname(file.dest), { recursive: true });
            await cp(file.src, file.dest);
          }
        }
      };
    })()
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  }
});
