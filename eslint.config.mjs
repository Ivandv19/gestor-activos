import { defineConfig } from 'eslint-define-config';
import globals from 'globals';
import js from '@eslint/js';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default defineConfig([
  // Configuración base: Aplica a todos los archivos JavaScript
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      sourceType: 'module', // Cambia a "module" si usas ES Modules
      globals: {
        ...globals.browser, // Variables globales del navegador
        ...globals.node, // Variables globales de Node.js
      },
    },
  },

  // Reglas recomendadas de ESLint
  {
    files: ['**/*.{js,mjs,cjs}'],
    ...js.configs.recommended,
  },

  // Integración con Prettier
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error', // Activa Prettier como regla de ESLint
    },
    ...prettierConfig, // Desactiva reglas conflictivas
  },
]);
