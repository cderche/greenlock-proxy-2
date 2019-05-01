require('dotenv').config();
var async = require('async');

////////////////
// Test Store //
////////////////

var storeTest = require('greenlock-store-test');

var storer = require('./greenlock-storage-s3').create({
    debug: true
    , accessKeyId: process.env.AWS_ACCESS_KEY_ID
    , secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    , bucketName: process.env.AWS_BUCKET_NAME
    , bucketRegion: process.env.AWS_BUCKET_REGION
    , configDir: 'test/acme/'
})

////////////////////
// Test Challange //
////////////////////

var challengeTest = require('greenlock-challenge-test');

var challenger = require('./greenlock-challenge-s3').create({
    debug: true
    , accessKeyId: process.env.AWS_ACCESS_KEY_ID
    , secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    , bucketName: process.env.AWS_BUCKET_NAME
    , bucketRegion: process.env.AWS_BUCKET_REGION
    , directory: 'test/acme-challenge/'
});

var domain = 'example.com';

///////////////
// Run Tests //
///////////////

async.parallel({
    challenge: function(cb) {
        challengeTest.test('http-01', domain, challenger).then(function () {
            cb();
        }).catch(function (err) {
            cb(err);
        });
    },
    store: function(cb) {
        storeTest.test(storer).then(function () {
            cb();
        }).catch(function (err) {
            cb(err);
        })
    }
}, function(err, results) {
    if (err) { 
        console.error('FAILED: Not all tests passed.');
        console.error(err.message);
    } else {
        console.info("PASSED: All soft tests.");
    }
});