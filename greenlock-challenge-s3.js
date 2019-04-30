require('dotenv').config();

const AWS = require('aws-sdk');

const defaultOptions = {
    apiVersion: '2006-03-01'
    , accessKeyId: null
    , secretAccessKey: null
    , bucketName: null
    , bucketRegion: null
}

module.exports.create = (createOptions) => {
    const options = Object.assign({}, defaultOptions, createOptions);

    const handlers = {
        getOptions: () => options,

        set: (opts, domain, key, value, done) => {

            AWS.config.update({ region: opts.bucketRegion, credentials: new AWS.Credentials({ accessKeyId: opts.accessKeyId, secretAccessKey: opts.secretAccessKey }) });
            const s3 = new AWS.S3({ apiVersion: '2006-03-01', params: { Bucket: opts.bucketName } });

            challengeKey = encodeURIComponent(key);
            s3.putObject({ Key: challengeKey, Body: String(value), Bucket: opts.bucketName }, function (err, data) {
                if (err) {
                    console.error('There was an error creating your challenge: ' + err.message);
                } else {
                    console.log('Successfully created challenge.');
                }
                done(err, data);
            });
        },

        get: (opts, domain, key, done) => {

            AWS.config.update({ region: opts.bucketRegion, credentials: new AWS.Credentials({ accessKeyId: opts.accessKeyId, secretAccessKey: opts.secretAccessKey }) });
            const s3 = new AWS.S3({ apiVersion: '2006-03-01', params: { Bucket: opts.bucketName } });

            challengeKey = encodeURIComponent(key);
            s3.putObject({ Key: challengeKey, Bucket: opts.bucketName }, function (err, data) {
                if (err) {
                    console.error('There was an error retrieving your challenge: ' + err.message);
                } else {
                    console.log('Successfully retrieved challenge.' + String(data['Body']));
                }
                done(err, data['Body']);
            });
        },

        remove: (opts, domain, key, done) => {

            AWS.config.update({ region: opts.bucketRegion, credentials: new AWS.Credentials({ accessKeyId: opts.accessKeyId, secretAccessKey: opts.secretAccessKey }) });
            const s3 = new AWS.S3({ apiVersion: '2006-03-01', params: { Bucket: opts.bucketName } });

            challengeKey = encodeURIComponent(key);
            s3.deleteObject({ Key: challengeKey, Bucket: opts.bucketName }, function (err, data) {
                if (err) {
                    console.error('There was an error deleting your challenge: ', err.message);
                } else {
                    console.log('Successfully deleted challenge.');
                }
                done(err, data);
            });
        }
    };

    return handlers;
};