var Greenlock = require("greenlock");

var greenlock = Greenlock.create({
    email: "cyrille.derche@dokspot.com"
,   agreeTos: true
// ,   configDir: '~/.config/acme'
,   configDir: require('path').join(global.rootDir, 'acme', 'etc')
,   communityMember: true
,   securityUpdates: true
,   server: 'https://acme-staging-v02.api.letsencrypt.org/directory'
,   version: 'draft-11'
,   approvedDomains: [ "slave.clientdomain1.com" , "slave.clientdomain2.com" , "example.com" ]
,   store: require('greenlock-store-fs')
,   debug: true
});

////////////////////////
// http-01 Challenges //
////////////////////////

// http-01 challenge happens over http/1.1, not http2
var redirectHttps = require('redirect-https')();
var acmeChallengeHandler = greenlock.middleware(function (req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end('<h1>Hello, ⚠️ Insecure World!</h1><a>Visit Secure Site</a>');
});
require('http').createServer(acmeChallengeHandler).listen(80, function () {
  console.log("Listening for ACME http-01 challenges on", this.address());
});



////////////////////////
// http2 via SPDY h2  //
////////////////////////

// spdy is a drop-in replacement for the https API
var spdyOptions = Object.assign({}, greenlock.tlsOptions);
spdyOptions.spdy = { protocols: [ 'h2', 'http/1.1' ], plain: false };
var server = require('spdy').createServer(spdyOptions, function (req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end('<h1>Hello, 🔐 Secure World!</h1>');
});
server.on('error', function (err) {
  console.error(err);
});
server.on('listening', function () {
  console.log("Listening for SPDY/http2/https requests on", this.address());
});
server.listen(443);