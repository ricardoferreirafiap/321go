import { defineConfig } from 'vite'
import path from 'path'
import { execSync } from 'child_process'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'


const rootDir = path.resolve(__dirname, '../..')

const getBuildVersion = () => {
  try {
    const sha = execSync('git -C "' + rootDir + '" rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
    if (sha) return `0.0.1+${sha}`;
  } catch {
    // fallback silencioso
  }

  return `0.0.1+${Date.now()}`;
};

const getLastCommitDate = () => {
  try {
    const rawDate = execSync('git -C "' + rootDir + '" log -1 --format=%cI', { encoding: 'utf-8' }).trim();
    if (!rawDate) return 'N/A';

    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return 'N/A';

    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'N/A';
  }
};

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(getBuildVersion()),
    'import.meta.env.VITE_LAST_UPDATE': JSON.stringify(getLastCommitDate()),
  },
  build: {
    outDir: path.resolve(__dirname, '../../dist'),
    emptyOutDir: true,
  },
  plugins: [
    figmaAssetResolver(),
    basicSsl(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    https: true,
    host: '0.0.0.0',
    port: 5173,
    watch: {
      ignored: ['**/.wwebjs_cache/**', '**/wwebjs_auth/**', '**/.wwebjs_auth/**'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})