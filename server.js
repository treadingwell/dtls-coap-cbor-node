'use strict'
const dtls = require('node-dtls'),
  fs = require('fs'),
  packet = require('coap-packet'),
  cbor = require('cbor')

// DTLS connection
const pem = fs.readFileSync('server.pem');
const server = dtls.createServer({
  type: 'udp4',
  key: pem,
  cert: pem
});
server.bind(4433);
server.on('secureConnection', function(socket) {

  // Once DTLS is established, we're returned a socket that uses
  // node's dgram stynax
  console.log('New connection from ' + [socket.rinfo.address, socket.rinfo.port].join(':'));
  socket.on('message', function(message) {

    // using cbor to decode all the payloads for the moment... Need to base this
    // on the Content-Format soon though
    cbor.decodeAll(packet.parse(message).payload, (err, cborMsg) => {
      console.log("From client: " + JSON.stringify(cborMsg))
    });

    // This can be any JSON compatible value.  It will be converted to CBOR.
    let cborPayload = {
      "name": "something",
      "stuff": {
        "another": [
          "steve",
          1
        ]
      }
    }

    // Specified in the coap-packet library.  Specific format for COAP headers.
    let reply = {
      token: new Buffer(4),
      // defined in the IETF spec... need to generate specially
      code: '0.01',
      // nee
      messageId: 42,
      // encoding to CBOR here:
      payload: cbor.encode(cborPayload),
      options: [{
        name: 'If-Match',
        value: new Buffer(5)
      }, {
        name: 'Uri-Path',
        value: new Buffer('hello')
      }, {
        // this lets the other side know it's going to be CBOR
        name: 'Content-Format',
        value: new Buffer('application/cbor')
      }]
    }

    // This just sends said packet by first wrapping it in the coap binary
    // protocol
    socket.send(packet.generate(reply));
  });
});
