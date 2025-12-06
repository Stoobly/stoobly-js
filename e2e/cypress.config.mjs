import { defineConfig } from 'cypress';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);
const installLogsPrinter = require('cypress-terminal-report/src/installLogsPrinter');
const webpackPreprocessor = require('@cypress/webpack-preprocessor');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

export default defineConfig({
  e2e: {
    specPattern: 'e2e/cypress/**/*.spec.{js,ts}',
    supportFile: 'e2e/cypress/support/e2e.ts',
    setupNodeEvents(on, config) {
      installLogsPrinter(on);
      
      // Configure webpack to resolve TypeScript path aliases
      on('file:preprocessor', webpackPreprocessor({
        webpackOptions: {
          resolve: {
            extensions: ['.ts', '.tsx', '.js'],
            plugins: [
              new TsconfigPathsPlugin({
                configFile: path.resolve(__dirname, '../tsconfig.json'),
              }),
            ],
          },
          module: {
            rules: [
              {
                test: /\.tsx?$/,
                exclude: [/node_modules/],
                use: [
                  {
                    loader: 'ts-loader',
                    options: {
                      transpileOnly: true,
                    },
                  },
                ],
              },
            ],
          },
        },
      }));
      
      return config;
    },
  },
});