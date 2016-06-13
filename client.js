'use strict';

const dtls = require('node-dtls'),
  packet = require('coap-packet'),
  cbor = require('cbor')

// The client is much simpler.  We just need a DTLS request instead of building
// a certificate ourselves

let cborPayload = {
  "name": "some client guy",
  "stuff": {
    "another": [
      "john",
      1
    ]
  }
}

let clientPacket = packet.generate({
  token: new Buffer(4),
  code: '0.01',
  messageId: 42,
  payload: cbor.encode(cborPayload),
  options: [{
    name: 'If-Match',
    value: new Buffer(5)
  }, {
    name: 'Uri-Path',
    value: new Buffer('serve')
  }, {
    name: 'Content-Format',
    value: new Buffer('application/cbor')
  }]
})

const client = dtls.connect(4433, 'localhost', 'udp4', function() {
  client.send(clientPacket);
});

client.on('message', function(msg) {
  cbor.decodeAll(packet.parse(msg).payload, (err, cborMsg) => {
    console.log(JSON.stringify(cborMsg));
  });
});
