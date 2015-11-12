var http      = require('http')
  , https     = require('https')
  , _         = require('underscore')
  , auth      = require('basic-auth')
  , httpProxy = require('http-proxy');

function createServer(options) {
  var opts     = options || {}
    , proxy    = httpProxy.createProxyServer({})
    , users    = _.isObject(opts.users) ? opts.users : {}
    , targets  = _.isArray(opts.targets) ? opts.targets : []
    , isHttps  = !_.isUndefined(opts.ssl)
    , basic    = {}
    , server

  if (isHttps) {
    server = https.createServer(opts.ssl);
  } else {
    server = http.createServer();
  }

  server.on('request', function (req, res) {
    var credentials = auth(req);

    if (!credentials) {
      res.statusCode = 401;
      res.setHeader('WWW-Authenticate', 'Basic realm="basic proxy"')
      res.end();
      return;
    }

    var user = credentials.name,
        pass = credentials.pass;

    if (_.isUndefined(users[user]) ||
        users[user] !== pass) {
      res.statusCode = 401;
      res.setHeader('WWW-Authenticate', 'Basic realm="basic proxy"')
      res.end();
      return;
    }

    var target = _.find(targets, function (elem) {
      if (!_.isString(elem.user) && !_.isArray(elem.user)) {
        return false;
      }

      if (_.isString(elem.user) && elem.user === user) {
        return true;
      }

      if (_.contains(elem.user, user)) {
        return true;
      }

       return false;
    });

    if (!target || _.isUndefined(target.url)) {
      res.statusCode = 404;
      res.end();
      return;
    }

    console.log('[' + new Date().toUTCString() + ']: access user: ' + credentials.name + ' to ' + target.url);

    if (_.isObject(target.appendHeaders)) {
      req.headers = _.extend(req.headers, target.appendHeaders);
    }

    proxy.web(req, res, { target: target.url });
  });

  return server;
}

module.exports = {
  createServer: createServer
}
