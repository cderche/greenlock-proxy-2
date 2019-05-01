const fileNames = {
    privkey: {
        pem: 'privkey.pem'
        , jwk: 'privkey.jwk'
    }
    , cert: 'cert.pem'
    , chain: 'chain.pem'
    , fullchain: 'fullchain.pem'
    , bundle: 'bundle.pem'
}

var path = require('path');
var Promise = require('bluebird')

const AWS = require('aws-sdk');
AWS.config.setPromisesDependency(Promise);

const defaultOptions = {
    apiVersion: '2006-03-01'
    , accessKeyId: null
    , secretAccessKey: null
    , bucketName: null
    , bucketRegion: null
    , accountsDir: path.join("accounts", new URL(process.env.LETSENCRYPT_ENDPOINT).host, new URL(process.env.LETSENCRYPT_ENDPOINT).pathname)
}

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

module.exports.create = function (createOptions) {

    const options = Object.assign({}, defaultOptions, createOptions);

    AWS.config.update({ region: options.bucketRegion, credentials: new AWS.Credentials({ accessKeyId: options.accessKeyId, secretAccessKey: options.secretAccessKey }) });

    const handlers = {
        getOptions: () => options,

        certificates: {
            check: (opts) => {
                var id = opts.certificate && opts.certificate.id || opts.subject;
                console.log('certificates.check for', opts.certificate, opts.subject);

                var privkeyPath = certificatesPath(opts, id, fileNames.privkey.pem);
                var certPath = certificatesPath(opts, id, fileNames.cert);
                var chainPath = certificatesPath(opts, id, fileNames.chain);

                console.log('privkeyPath:', privkeyPath);
                console.log('certPath:', certPath);
                console.log('chainPath:', chainPath);

                return Promise.all([
                    s3.getObject({ Key: privkeyPath, Bucket: opts.bucketName }).promise().then(function (data) {
                        console.log('Successfully retrieved certificate privkey.pem:', data.Body.toString());
                        return data.Body.toString();
                    }).catch(function (err) {
                        console.error('There was an error retrieving your certificate privkey.pem:', err.message);
                        throw err;
                    }),
                    s3.getObject({ Key: certPath, Bucket: opts.bucketName }).promise().then(function (data) {
                        console.log('Successfully retrieved certificate cert.pem:', data.Body.toString());
                        return data.Body.toString();
                    }).catch(function (err) {
                        console.error('There was an error retrieving your certificate cert.pem:', err.message);
                        throw err;
                    }),
                    s3.getObject({ Key: chainPath, Bucket: opts.bucketName }).promise().then(function (data) {
                        console.log('Successfully retrieved certificate chain.pem:', data.Body.toString());
                        return data.Body.toString();
                    }).catch(function (err) {
                        console.error('There was an error retrieving your certificate chain.pem:', err.message);
                        throw err;
                    })
                ]).then(function (values) {
                    return {
                        privkey: values[0]
                        , cert: values[1]
                        , chain: values[2]
                    }
                }).catch(function (err) {
                    throw err;
                });
            },
            checkKeypair: (opts) => {
                console.log('certificates.checkKeypair:', opts.certificate, opts.subject);

                id = opts.certificate.kid || opts.certificate.id || opts.subject;

                pemKeyPath = certificatesPath(opts, id, fileNames.privkey.pem);
                jwkKeyPath = certificatesPath(opts, id, fileNames.privkey.jwk);

                console.log('pemKeyPath:', pemKeyPath);
                console.log('jwkKeyPath:', jwkKeyPath);

                Promise.all([
                    s3.getObject({ Key: pemKeyPath, Bucket: opts.bucketName }).promise().then(function (data) {
                        console.log('Successfully retrieved certificate PEM keypair:', data.Body.toString());
                        return data.Body.toString();
                    }).catch(function (err) {
                        console.error('There was an error retrieving your certificate PEM keypair:', err.message);
                        throw err;
                    }),
                    s3.getObject({ Key: jwkKeyPath, Bucket: opts.bucketName }).promise().then(function (data) {
                        console.log('Successfully retrieved certificate JWK keypair:', data.Body.toString());
                        return data.Body.toString();
                    }).catch(function (err) {
                        console.error('There was an error retrieving your certificate JWK keypair:', err.message);
                        throw err;
                    })
                ]).then(function (values) {
                    return {
                        privateKeyPem: values[0]
                        , privateKeyJwk: values[1]
                    }
                });

            },
            setKeypair: (opts) => {
                id = opts.certificate.kid || opts.certificate.id || opts.subject;
                console.log('certificates.setKeypair for', id);

                pemKeyPath = certificatesPath(opts, id, fileNames.privkey.pem);
                jwkKeyPath = certificatesPath(opts, id, fileNames.privkey.jwk);

                console.log('pemKeyPath:', pemKeyPath);
                console.log('jwkKeyPath:', jwkKeyPath);

                return Promise.all([
                    s3.putObject({ Key: pemKeyPath, Body: opts.keypair.privateKeyPem, Bucket: opts.bucketName }).promise().then(function (data) {
                        console.log('Successfully set the PEM privateKey.');
                    }).catch(function (err) {
                        console.error('There was an error setting your PEM privateKey:', err.message);
                        throw err;
                    }),
                    s3.putObject({ Key: jwkKeyPath, Body: opts.keypair.privateKeyJwk, Bucket: opts.bucketName }).promise().then(function (data) {
                        console.log('Successfully set the JWK privateKey.');
                    }).catch(function (err) {
                        console.error('There was an error setting your JWK privateKey:', err.message);
                        throw err;
                    })
                ]).then(function (values) {
                    return null;
                });
            },
            set: (opts) => {
                console.log('certificates.set:', opts.subject, opts.pems);

                var pems = {
                    cert: opts.pems.cert
                    , chain: opts.pems.chain
                    , privkey: opts.pems.privkey
                }

                var certPath = certificatesPath(opts, opts.subject, fileNames.cert);
                var chainPath = certificatesPath(opts, opts.subject, fileNames.chain);
                var fullchainPath = certificatesPath(opts, opts.subject, fileNames.fullchain);
                var bundlePath = certificatesPath(opts, opts.subject, fileNames.bundle);

                var fullchainPem = [pems.cert, pems.chain].join('\n'); // for Apache, Nginx, etc
                var bundlePem = [pems.privkey, pems.cert, pems.chain].join('\n'); // for HAProxy

                Promise.all([
                    s3.putObject({ Key: certPath, Body: pems.cert, Bucket: opts.bucketName }).promise().than(function (data) {
                        console.log('Successfully set', certPath);
                    }).catch(function (err) {
                        console.error('There was an error setting cert.pem:', err.message);
                        throw err;
                    }),
                    s3.putObject({ Key: chainPath, Body: pems.chain, Bucket: opts.bucketName }).promise().than(function (data) {
                        console.log('Successfully set', chainPath);
                    }).catch(function (err) {
                        console.error('There was an error setting chain.pem:', err.message);
                        throw err;
                    }),
                    s3.putObject({ Key: fullchainPath, Body: fullchainPem, Bucket: opts.bucketName }).promise().than(function (data) {
                        console.log('Successfully set', fullchainPath);
                    }).catch(function (err) {
                        console.error('There was an error setting fullchain.pem:', err.message);
                        throw err;
                    }),
                    s3.putObject({ Key: bundlePath, Body: bundlePem, Bucket: opts.bucketName }).promise().than(function (data) {
                        console.log('Successfully set', bundlePath);
                    }).catch(function (err) {
                        console.error('There was an error setting bundle.pem:', err.message);
                        throw err;
                    })
                ]).then(function (values) {
                    return null;
                });
            }
        },
        accounts: {
            check: (opts) => {
                console.log("accounts.check");
                console.log(opts);
            },
            checkKeypair: (opts) => {
                var id = opts.account.id || opts.email || 'single-user';
                console.log('accounts.checkKeypair for', id);

                key = accountsPath(opts, id)

                return s3.getObject({ Key: key, Bucket: opts.bucketName }).promise().then(function (data) {
                    console.log('Successfully retrieved account keypair.');
                    var keypair = JSON.parse(data.Body.toString());
                    return {
                        privateKeyPem: keypair.privateKeyPem // string PEM private key
                        , privateKeyJwk: keypair.privateKeyJwk // object JWK private key
                    };
                }).catch(function (err) {
                    console.error('There was an error retrieving your account keypair:', err.message);
                    throw err;
                });

            },
            setKeypair: (opts) => {
                console.log('accounts.setKeypair for', opts.account, opts.email, opts.keypair);

                var id = opts.account.id || opts.email || 'single-user';
                key = accountsPath(opts, id)

                var body = JSON.stringify({
                    privateKeyPem: opts.keypair.privateKeyPem // string PEM
                    , privateKeyJwk: opts.keypair.privateKeyJwk // object JWK
                });

                s3.putObject({ Key: key, Body: body, Bucket: opts.bucketName }).promise().then(function (data) {
                    console.log('Successfully created account keypair.');
                    return null;
                }).catch(function (err) {
                    console.error('There was an error creating account keypair:', err.message);
                    throw err;
                });

            },
            set: (opts) => {
                // console.log("accounts.set");

                // AWS.config.update({ region: opts.bucketRegion, credentials: new AWS.Credentials({ accessKeyId: opts.accessKeyId, secretAccessKey: opts.secretAccessKey }) });
                // const s3 = new AWS.S3({ apiVersion: '2006-03-01', params: { Bucket: opts.bucketName } });

                // var id = opts.account.id || opts.email || 'single-user';
                // key = opts.configDir + "accounts/" + id;
            }
        }
    }

    return handlers;
}

function certificatesPath(opts, id, fileName) {
    return path.join(opts.configDir, 'live', id, fileName);
}

function accountsPath(opts, id) {
    return path.join(opts.configDir, opts.accountsDir, id + '.json');
}