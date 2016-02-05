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

function IoTAPI(IoTSvc) {

  var router = express.Router();

  ///////////////////////////////////////////////////////////////////
  // get the list of connected controllers
  //
  ///////////////////////////////////////////////////////////////////
  router.get('/controllers',

    async(req, res)=> {

      var controllerList = IoTSvc.getConnectedControllers();

      res.json(controllerList);
    });

  ///////////////////////////////////////////////////////////////////
  // get the list of devices for specific controller
  //
  ///////////////////////////////////////////////////////////////////
  router.get('/devices/:controllerId',

    async(req, res)=> {

      var controllerId = req.params.controllerId;

      var deviceList = IoTSvc.getAvailableDevices(controllerId);

      res.json(deviceList);
    });

  return router;
}

module.exports = IoTAPI;