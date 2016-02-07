var Camelot = require('camelot');

var camelot = new Camelot( {
  'rotate' : '180',
  'flip' : 'v'
});

camelot.on('frame', function (image) {
  console.log('frame received!');
});

camelot.on('error', function (err) {
  console.log(err);
});

camelot.grab( {
  'title' : 'Camelot',
  'font' : 'Arial:24',
  'frequency' : 1
});