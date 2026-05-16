const path = require('path');

const srcPath = path.resolve(__dirname, 'src');

/** Алиасы межслойных импортов относительно src: import x from '/entities/group' */
const srcAliases = ['entities', 'shared', 'features', 'widgets', 'pages', 'app'].reduce(
  (aliases, layer) => ({
    ...aliases,
    [`/${layer}`]: path.join(srcPath, layer),
  }),
  {}
);

module.exports = {
  webpack: {
    alias: srcAliases,
    configure: (webpackConfig) => {
      webpackConfig.resolve.plugins = webpackConfig.resolve.plugins.filter(
        (plugin) => plugin.constructor.name !== 'ModuleScopePlugin'
      );
      return webpackConfig;
    },
  },
};
