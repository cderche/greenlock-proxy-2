require('dotenv').config();
var storeTest = require('greenlock-store-test');

var store = require('./greenlock-storage-s3').create({
    debug: false
    , accessKeyId: process.env.AWS_ACCESS_KEY_ID
    , secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    , bucketName: process.env.AWS_BUCKET_NAME
    , bucketRegion: process.env.AWS_BUCKET_REGION
    , configDir: 'acme/'
})

storeTest.test(store).then(function () {
    console.info("PASS");
})