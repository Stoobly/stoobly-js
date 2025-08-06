import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    specPattern: 'e2e/cypress/**/*.spec.{js,ts}',
    supportFile: false,
  },
});