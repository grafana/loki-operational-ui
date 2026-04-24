// force timezone to UTC to allow tests to work regardless of local timezone
// generally used by snapshots, but can affect specific tests
process.env.TZ = 'UTC';

const baseConfig = require('./.config/jest.config');
const { grafanaESModules, nodeModulesToTransform } = require('./.config/jest/utils');

// ESM packages to transpile in addition to the scaffold list (avoid editing `.config/jest/utils.js`).
const projectESModules = [...grafanaESModules, 'react-code-block'];

module.exports = {
  // Jest configuration provided by Grafana scaffolding
  ...baseConfig,
  transformIgnorePatterns: [nodeModulesToTransform(projectESModules)],
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    '^monaco-editor$': '<rootDir>/.config/jest/mocks/monaco-editor.ts',
    '^@monaco-editor/react$': '<rootDir>/.config/jest/mocks/monaco-editor-react.ts',
  },
};
