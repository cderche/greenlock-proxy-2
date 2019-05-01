require('dotenv').config();
var Greenlock = require("greenlock");

var greenlock = Greenlock.create({
  email: "cyrille.derche@dokspot.com"
  , agreeTos: true
  , configDir: 'acme/'
  , communityMember: true
  , securityUpdates: true
  , server: process.env.LETSENCRYPT_ENDPOINT
  , version: 'draft-11'
  , approvedDomains: ["docker.clientdomain1.com", "docker.clientdomain2.com", "node.clientdomain1.com", "node.clientdomain2.com", "example.com"]
  , store: require('./greenlock-storage-s3').create({
    debug: false
    , accessKeyId: process.env.AWS_ACCESS_KEY_ID
    , secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    , bucketName: process.env.AWS_BUCKET_NAME
    , bucketRegion: process.env.AWS_BUCKET_REGION
    , configDir: 'acme/'
  })
  , debug: false
  , challengeType: 'http-01'
  , challenge: require('./greenlock-challenge-s3').create({
    debug: false
    , accessKeyId: process.env.AWS_ACCESS_KEY_ID
    , secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    , bucketName: process.env.AWS_BUCKET_NAME
    , bucketRegion: process.env.AWS_BUCKET_REGION
    , directory: 'acme-challenge/'
  })
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
spdyOptions.spdy = { protocols: ['h2', 'http/1.1'], plain: false };
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