require('dotenv').config();
var async = require('async');
var colors = require('colors');

var AWS = require('aws-sdk');
AWS.config.setPromisesDependency(Promise);
AWS.config.update({ region: process.env.AWS_BUCKET_REGION, credentials: new AWS.Credentials({ accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY }) });

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

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
    console.log('Cleaning up...');
    
    s3.listObjects({ Prefix: 'test', Bucket: process.env.AWS_BUCKET_NAME }).promise().then(function(data){

        var objectKeys = [];

        for(let i = 0; i < data.Contents.length; i++){
            objectKeys.push({
                Key: data.Contents[i].Key
            })
         }
        
        s3.deleteObjects({ Delete: { Objects: objectKeys }, Bucket: process.env.AWS_BUCKET_NAME }).promise().then(function (data) {
            console.log("Clean up successful.".green);
        }).catch( function(err) {
            console.error(err.message);
        });
    }).catch( function(err) {
        console.error(err.message);
    });

    if (err) {
        console.error('FAILED: Not all tests passed.'.red.underline);
        console.error(err.message.red);
    } else {
        console.info("PASSED: All soft tests.".green.underline);        
    }
});