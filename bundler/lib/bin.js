const serve = require('webpack-serve');
const config = require('../webpack.entries.config.js');
const options = require('../serve.config');

const webpackRegex = /(webpack)/;

const isWebpackRelatedRecursive = ({ request, issuer }) => {
  // if request itself is webpack related
  if (request && request.match && request.match(webpackRegex)) {
    return true;
  }

  // recursively walk into issuer
  if (issuer) {
    return isWebpackRelatedRecursive(issuer);
  }

  return false;
};

serve(Object.assign(options, { config })).then(server => {
  server.on('listening', () => {});

  const { compiler, options } = server;

  compiler.hooks.done.tap('me', ({ compilation }) => {
    try {
      // console.time('doneProcess');

      const stats = compilation.getStats().toJson();

      const entryModules = stats.modules
        .filter(m => m.reasons.find(r => r.type === 'single entry'))
        .filter(m => !(m.name && m.name.match(webpackRegex)));

      const entryPoints = [...compilation.entrypoints].reduce((acc, [k, e]) => {
        const modules = e.chunks
          .reduce((acc, c) => acc.concat(c.getModules()), [])
          .filter(m => !isWebpackRelatedRecursive(m))
          .filter(m => !(m.constructor.name !== 'DelegatedModule' && m.context === null))
          .filter(m => m.request || (m.originalRequest && m.originalRequest.request))
          .map(
            m =>
              m.originalRequest
                ? {
                    as: m.originalRequest.rawRequest,
                    hash: m.originalRequest.hash || m.hash,
                    id: m.originalRequest.id || m.id,
                    // request: m.originalRequest.request,
                    resource: m.originalRequest.resource,
                  }
                : {
                    as: m.rawRequest,
                    hash: m.hash,
                    id: m.id,
                    // request: m.request,
                    resource: m.resource,
                    exports: m.buildMeta && m.buildMeta.providedExports,
                  }
          );

        const main = entryModules.find(m => m.chunks.find(c => c === k));
        const examples = main.providedExports;

        return Object.assign(acc, {
          [k]: {
            modules,
            main,
            examples,
          },
        });
      }, {});

      // console.dir(entryPoints, { depth: 2 });

      // console.timeEnd('doneProcess');
    } catch (err) {
      console.log(err);
    }
  });
});
