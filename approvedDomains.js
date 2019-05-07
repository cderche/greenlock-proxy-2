const AWS = require('aws-sdk');
AWS.config.update({
    credentials: new AWS.Credentials({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID
        , secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    })
});

var dynamodb = new AWS.DynamoDB();

module.exports.approveDomains = (opts, certs, cb) => {
    console.log('approveDomains:', opts.domains);

    var params = {
        TableName: 'Organisations'
    }

    dynamodb.query(params, function (err, data) {

        if (err) {
            console.error(err.message);
            cb(err);
        }else{
            console.log(data);
            // Check there is a match
            cb(null, { options: opts, certs: certs });
        }
        
    });
};