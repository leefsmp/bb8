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
var express = require('express');

function BB8API(IoTSvc) {

  var router = express.Router();

  ///////////////////////////////////////////////////////////////////
  // connect to specified bb8 device
  //
  ///////////////////////////////////////////////////////////////////
  router.get('/connect/:controllerId/:deviceId',

    async(req, res)=> {

      var deviceId = req.params.deviceId;
      var controllerId = req.params.controllerId;

      try {

        var result = await IoTSvc.sendCommand(controllerId, {
          deviceId: deviceId,
          cmdId: 'BB8_CONNECTION_REQUEST',
          requestResult: true
        });

        res.json('connected');
      }
      catch(ex){

        console.log(ex)
        res.status = 400;
        res.json(ex);
      }
    });

  ///////////////////////////////////////////////////////////////////
  // Rolls BB8 at speed and heading
  //
  ///////////////////////////////////////////////////////////////////
  router.get('/roll/:controllerId/:deviceId/:speed/:heading',

    async(req, res)=> {
    
      var speed = req.params.speed;
      var heading = req.params.heading;
      var deviceId = req.params.deviceId;
      var controllerId = req.params.controllerId;

      IoTSvc.sendCommand(controllerId, {
        deviceId: deviceId,
        cmdId: 'ROLL',
        args:{
          speed: speed,
          heading: heading
        }
      });

      res.json('done');
    });

  ///////////////////////////////////////////////////////////////////
  // Sets LED blinking period and color
  //
  ///////////////////////////////////////////////////////////////////
  router.get('/blink/:controllerId/:deviceId/:enabled/:period/:color',

    async(req, res)=> {

      var enabled = req.params.enabled;
      var period = req.params.period;
      var color = req.params.color;
      var deviceId = req.params.deviceId;
      var controllerId = req.params.controllerId;

      IoTSvc.sendCommand(controllerId, {
        deviceId: deviceId,
        cmdId: 'BLINK',
        args:{
          enabled: enabled,
          period: period,
          color: color
        }
      });

      res.json('done');
    });

  ///////////////////////////////////////////////////////////////////
  // Sets BB8 heading
  //
  ///////////////////////////////////////////////////////////////////
  router.get('/heading/:controllerId/:deviceId/:heading',

    async(req, res)=> {

      var heading = req.params.heading;
      var deviceId = req.params.deviceId;
      var controllerId = req.params.controllerId;

      IoTSvc.sendCommand(controllerId, {
        deviceId: deviceId,
        cmdId: 'HEADING',
        args:{
          heading: heading
        }
      });

      res.json('done');
    });

  ///////////////////////////////////////////////////////////////////
  // Send path command
  //
  ///////////////////////////////////////////////////////////////////
  router.get('/path/:controllerId/:deviceId/:speed/:type',

    async(req, res)=> {

    var type = req.params.type;
    var speed = req.params.speed;
    var deviceId = req.params.deviceId;
    var controllerId = req.params.controllerId;

    IoTSvc.sendCommand(controllerId, {
      deviceId: deviceId,
      cmdId: 'PATH',
      args:{
        speed: speed,
        type: type,
        length: 3
      }
    });

    res.json('done');
  });

  return router;
}

module.exports = BB8API;