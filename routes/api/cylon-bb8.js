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
var cylon = require('cylon');

function BB8API() {

  var router = express.Router();

  ///////////////////////////////////////////////////////////////////
  // Keeps a map of connected devices
  //
  ///////////////////////////////////////////////////////////////////
  var deviceMap = {}

  function getDevice(uuid){

    if(deviceMap[uuid]) {

      return deviceMap[uuid];
    }
    else {
      return null;
    }
  }

  ///////////////////////////////////////////////////////////////////
  // Connects a BB8 device
  //
  ///////////////////////////////////////////////////////////////////
  router.get('/connect/:uuid', function (req, res) {

    var uuid = req.params.uuid;

    if(getDevice(uuid)) {

      res.json({
        status: 'connected',
        uuid: uuid
      });

      return;
    };

    cylon.robot({

      connections: {
        bluetooth: {
          adaptor: 'central',
          uuid: uuid,
          module: 'cylon-ble'
        }
      },

      devices: {
        bb8: {
          driver: 'bb8',
          module: 'cylon-sphero-ble'
        }
      },

      work: function(driver) {

        var bb8 = driver.bb8;

        console.log('Device connected: ' +
          bb8.connection.details.uuid);

        bb8.color(0x0000FF);

        setTimeout(function() {
          bb8.color(0x00);
        }, 3000);

        // collision handler
        bb8.on("collision", function(data) {

          bb8.color(0xFF0000);

          bb8.stop(function(){

            setTimeout(function() {
              bb8.color(0x00);
            }, 1000);
          });
        });

        // Activate collision
        bb8.detectCollisions();

        // Auto stop the Sphero when it detects it
        // has become disconnected
        bb8.stopOnDisconnect()

        deviceMap[uuid] = bb8;

        res.json({
          status: 'connected',
          uuid: uuid
        });
      }
    }).start();
  });

  ///////////////////////////////////////////////////////////////////
  // Rolls BB8 at speed and heading
  //
  ///////////////////////////////////////////////////////////////////
  router.get('/roll/:uuid/:speed/:heading', function (req, res) {

    var uuid = req.params.uuid;
    var speed = req.params.speed;
    var heading = req.params.heading;

    getDevice(uuid).roll(speed, heading, function(){

      console.log('roll: ' + speed + ' ' + heading);

      res.json({
        uuid: uuid,
        heading: heading,
        command: 'roll',
        speed: speed
      });
    });
  });

  ///////////////////////////////////////////////////////////////////
  // Sets LED color (0 turns off the LED)
  //
  ///////////////////////////////////////////////////////////////////
  router.get('/color/:uuid/:hexStr', function (req, res) {

    var uuid = req.params.uuid;
    var hexStr = req.params.hexStr;

    var color = parseInt("0x" + hexStr);

    getDevice(uuid).color(color, function(){

      res.json({
        uuid: uuid,
        command: 'color',
        color: color
      });
    });
  });

  ///////////////////////////////////////////////////////////////////
  // Sets BB8 heading
  //
  ///////////////////////////////////////////////////////////////////
  router.get('/heading/:uuid/:heading', function (req, res) {

    var uuid = req.params.uuid;
    var heading = req.params.heading;

    getDevice(uuid).setHeading(heading, function(){

      res.json({
        uuid: uuid,
        heading: heading,
        command: 'heading'
      });
    });
  });

  return router;
}

module.exports = BB8API();