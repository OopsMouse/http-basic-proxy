var basicProxy = require('../lib/basic-proxy')
  , fs      = require('fs')
  , path    = require('path')
  , http    = require('http')
  , should  = require('should')
  , request = require('request');

// Becasue this test use Self-Signed Certificate,
// env NODE_TLS_REJECT_UNAUTHORIZED must be set 0
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var httpsServerOpts = {
  key: fs.readFileSync(path.join(__dirname, 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'cert.pem'))
};

describe('basic proxy', function () {

  var users = { root: "root", admin: "123456", etc: "o93rf2hi" }

  describe('#init', function () {
    var tests = [
      { users: users, targets: [] },
      { users: users, targets: [{ user: "root", url: 'http://127.0.0.1:3333' }, { user: "admin", url: 'http://127.0.0.1:4444' }] },
      { users: users, targets: [{ user: "root", url: 'http://127.0.0.1:3333' }, { user: [ "admin", "etc" ], "url": 'http://127.0.0.1:4444' }] },
      { users: users, targets: [{ user: "root", url: 'http://127.0.0.1:3333', appendHeaders: { personalId: "a530467209" }}] },
      { users: users, ssl: httpsServerOpts, targets: [] },
      { users: users, ssl: httpsServerOpts, targets: [{ user: "root", url: 'http://127.0.0.1:3333' }, { user: "admin", url: 'http://127.0.0.1:4444' }] },
      { users: users, ssl: httpsServerOpts, targets: [{ user: "root", url: 'http://127.0.0.1:3333' }, { user: [ "admin", "etc" ], "url": 'http://127.0.0.1:4444' }] },
      { users: users, ssl: httpsServerOpts, targets: [{ user: "root", url: 'http://127.0.0.1:3333', appendHeaders: { personalId: "a530467209" }}] },
      { targets: [{ user: "root", url: 'http://127.0.0.1:3333' }, { user: "admin", url: 'http://127.0.0.1:4444' }] },
      { users: users },
      {}
    ];

    tests.forEach(function (test) {
      it('should success to create instance with (' + test + ')', function () {
        var proxy = basicProxy.createServer(test);
        proxy.should.not.be.null;
      });
    });
  });

  describe('#listen', function () {

    var proxyPort = 5555;

    it('should be a success to listen by specifying the port', function (done) {
      var proxy = basicProxy.createServer();
      proxy.listen(proxyPort, function () {
        proxyPort.should.be.exactly(proxy.address().port);
        proxy.close();
        done();
      });
    });

    var server1 = { body: 'server1', port: 3333, self: null, url: 'http://127.0.0.1:3333' }
      , server2 = { body: 'server2', port: 4444, self: null, url: 'http://127.0.0.1:4444' };

    beforeEach(function () {
      server1.self = http.createServer(function(req, res) {
        if (req.headers.personalid) {
          res.end(req.headers.personalid);
          return;
        }
        res.end(server1.body);
      }).listen(server1.port);
      server2.self = http.createServer(function(req, res) {
        if (req.headers.personalid) {
          res.end(req.headers.personalid);
          return;
        }
        res.end(server2.body);
      }).listen(server2.port);
    });

    afterEach(function() {
      server1.self.close();
      server2.self.close();
    })

    var tests = [
      { args : {}, expected: { status: 401, body: '' } },
      { args : { creadentials: "root:12345" }, expected: { status: 401, body: '' } },
      { args : { creadentials: "root:root" }, expected: { status: 401, body: '' } },
      { args : { creadentials: "root:root", targets: [] }, expected: { status: 401, body: '' } },
      { args : { users: users }, expected: { status: 401, body: '' } },
      { args : { creadentials: "root:12345", users: users  }, expected: { status: 401, body: '' } },
      { args : { creadentials: "root:root", users: users }, expected: { status: 404, body: '' } },
      { args : { creadentials: "root:root", users: users, targets: [] }, expected: { status: 404, body: '' } },
      { args : { creadentials: "root:root", users: users, targets: [{ user: {}, url: server1.url }] }, expected: { status: 404, body: '' } },
      { args : { creadentials: "root:root", users: users, targets: [{ user: "root", url: server1.url }] }, expected: {  status: 200, body: server1.body } },
      { args : { creadentials: "root:root", users: users, targets: [{ user: [ "root", "admin" ], url: server1.url }] }, expected: {  status: 200, body: server1.body } },
      { args : { creadentials: "root:root", users: users, targets: [{ user: [], url: server1.url }] }, expected: {  status: 404, body: ''} },
      { args : { creadentials: "root:root", users: users, targets: [{ user: "admin", url: server1.url }] }, expected: {  status: 404, body: '' } },
      { args : { creadentials: "root:root", users: users, targets: [{ user: "root", url: server1.url,  appendHeaders: { "personalid": "a530467209" } }] }, expected: {  status: 200, body: 'a530467209' } },
      { args : { creadentials: "root:root", users: users, targets: [{ user: "admin", url: server1.url }, { user: "root", url: server2.url }] }, expected: {  status: 200, body: server2.body } }
    ];

    tests.forEach(function (test) {
      var protocol = ((typeof test.args.ssl !== 'undefined') ? 'https' : 'http');
      it('should be a success to access via proxy to host with ' + protocol, function (done) {
        var proxy = basicProxy.createServer(test.args);
        proxy.listen(proxyPort);

        var url;
        if (test.args.creadentials) {
          url = protocol + '://' + test.args.creadentials + '@localhost:' + proxyPort
        } else {
          url = protocol + '://localhost:' + proxyPort
        }

        request(url, function (err, res, body) {
          res.statusCode.should.be.equal(test.expected.status);
          res.body.should.be.equal(test.expected.body);
          proxy.close();
          done();
        });
      });
    });
  });

});
