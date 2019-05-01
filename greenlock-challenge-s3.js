const AWS = require('aws-sdk');
var path = require('path');

const defaultOptions = {
    apiVersion: '2006-03-01'
    , accessKeyId: null
    , secretAccessKey: null
    , bucketName: null
    , bucketRegion: null
    , directory: ''
}

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

module.exports.create = (createOptions) => {
    const options = Object.assign({}, defaultOptions, createOptions);

    AWS.config.update({ region: options.bucketRegion, credentials: new AWS.Credentials({ accessKeyId: options.accessKeyId, secretAccessKey: options.secretAccessKey }) });

    const handlers = {
        getOptions: () => options,

        set: (opts) => {
            // console.log('opts:', opts);
            // console.log('options:', options);

            var challengeKey = path.join(options.directory, opts.challenge.token);
            console.log(challengeKey);
            
            return s3.putObject({ Key: challengeKey, Body: opts.challenge.keyAuthorization, Bucket: options.bucketName }).promise().then(function (data) {
                console.log('Successfully created challenge.');
                return null;
            }).catch(function (err) {
                console.error('There was an error creating your challenge: ' + err.message);
                throw err;
            });
        },

        get: (opts) => {
            // console.log('opts:', opts);

            challengeKey = options.directory + opts.challenge.token;
            return s3.getObject({ Key: challengeKey, Bucket: options.bucketName }).promise().then(function (data) {
                console.log('Successfully retrieved challenge.' + data.Body.toString());
                return { 
                    keyAuthorization: data.Body.toString()
                }
            }).catch(function (err) {
                console.error(err.message);
                return null;
            });
        },

        remove: (opts) => {
            
            challengeKey = options.directory + opts.challenge.token;
            return s3.deleteObject({ Key: challengeKey, Bucket: options.bucketName }).promise().then(function (data) {
                console.log('Successfully deleted challenge.');
                return data;
            }).catch(function (err) {
                console.error('There was an error deleting your challenge: ', err.message);
                throw err;
            });
        }
    };

    return handlers;
};