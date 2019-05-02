var colors = require('colors');

var Server80 = require('http').createServer({}, (req, res) => {
    console.log("New request");
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<h1>Hello,  ⚠️ Insecure World!</h1>');
});

Server80.on('listening', function () {
    console.log('Listening on %s', this.address());

    makeSelfRequest();
});

Server80.on('error', (err) => {
    console.error('ERROR Server80: %s'.red, err.message);
});

Server80.listen(80);

function makeSelfRequest() {
    var request = require('request-lite');
    request.get('http://0.0.0.0', function (err, res, body) {
      console.log('RESPONSE');
      if (err) {
        console.error('ERROR: %s'.red, err.message);
      } else {
        console.log('Status Code: %s', res.statusCode);
      }
    });
  }