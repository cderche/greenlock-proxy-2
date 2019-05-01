require('dotenv').config();

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
    , configDir: 'acme/'
})

storeTest.test(storer).then(function () {
    console.info("Passed Test: greenlock-storage-s3");
}).catch(function (err) {
    console.error("Failed Test: greenlock-storage-s3")
});

////////////////////
// Test Challange //
////////////////////

// var challengeTest = require('greenlock-challenge-test');

// var challenger = require('./greenlock-challenge-s3').create({
//     debug: true
//     , accessKeyId: process.env.AWS_ACCESS_KEY_ID
//     , secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
//     , bucketName: process.env.AWS_BUCKET_NAME
//     , bucketRegion: process.env.AWS_BUCKET_REGION
//     , directory: 'acme-challenge/'
// });

// var domain = 'example.com';

// challengeTest.test('http-01', domain, challenger).then(function () {
//     console.info("Passed Test: greenlock-store-s3");
// }).catch(function (err) {
//     console.error("Failed Test: greenlock-store-s3")
// });