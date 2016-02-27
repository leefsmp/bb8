/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Philippe Leefsma 2016 - ADN/Developer Technical Services
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////
import express from 'express';
import IoTAPI from './api/endpoints/IoT';
import bb8API from './api/endpoints/bb8';
import IoTSvc from './api/services/IoTSvc';
import config from '../config/prod.config';

var app = express();

app.use(config.server.host, express.static(__dirname + '/www/'));

app.set('port', process.env.PORT || config.server.port);

var server = app.listen(app.get('port'), function() {

  try {

    console.log('Server listening on: ');
    console.log(server.address());

    var ioTSvc = new IoTSvc(server);

    app.use(config.server.host + '/api/iot', IoTAPI(ioTSvc));
    app.use(config.server.host + '/api/bb8', bb8API(ioTSvc));

    ioTSvc.on('IOT_CONTROLLER_CONNECTED', (controllerId)=>{

      console.log('Controller connected: ' + controllerId);
    });

    ioTSvc.on('IOT_CONTROLLER_DISCONNECTED', (controllerId)=>{

      console.log('Controller disconnected: ' + controllerId);
    });
  }
  catch(ex) {

    console.log(ex);
  }
});
