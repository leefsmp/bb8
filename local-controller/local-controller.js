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

import noble from 'noble';
import ServiceManager from './api/services/svcManager';
import SpheroSvc from './api/services/spheroSvc';
import SocketSvc from './api/services/socketSvc';
import config from '../config/prod.config';
import shutdown from 'shutdown-handler';

import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import favicon from 'serve-favicon';
import express from 'express';
import path from 'path';

/////////////////////////////////////////////////////////////////////
//
//
/////////////////////////////////////////////////////////////////////
async function initializeSocket(socketSvc) {

  try {

    var socket = await socketSvc.connect(
      `${config.controller.host}:${config.server.port}`);

    console.log('Local controller connected: ' +
      config.controller.name);

    var spheroSvc = new SpheroSvc();

    ///////////////////////////////////////////////////////////////////
    // shutdown actions
    //
    ///////////////////////////////////////////////////////////////////
    shutdown.on('exit', async()=>{

      await spheroSvc.shutdown();
    });

    ///////////////////////////////////////////////////////////////////
    //
    //
    ///////////////////////////////////////////////////////////////////
    socket.emit('IOT_CLIENT_READY', {
      type: 'IOT_CONTROLLER',
      name: config.controller.name
    });

    ///////////////////////////////////////////////////////////////////
    // Scan request, controller scans local BLE devices
    //
    ///////////////////////////////////////////////////////////////////
    socket.on('IOT_SCAN_REQUEST', (data)=> {

      console.log('Scanning for devices ...\n');

      var filters = ['BB-', '2B-'];

      spheroSvc.scan(data.scanTimeout, filters);
    });

    spheroSvc.on('DEVICE_DETECTED', (device)=> {

      socket.emit('IOT_DEVICE_MSG', {
        connected: device.connected,
        deviceId: device.deviceId,
        address: device.address,
        name: device.name
      });

      console.log('Device detected: ');
      console.log('Name: ' + device.name);
      console.log('uuid: ' + device.deviceId);
      console.log('address: ' + device.address);
      console.log();
    });

    ///////////////////////////////////////////////////////////////////
    // Process various IoT command from server
    //
    ///////////////////////////////////////////////////////////////////
    socket.on('IOT_COMMAND', async(cmd)=>{

      console.log('IOT_COMMAND received:');
      console.log(cmd);

      try {

        switch (cmd.cmdId) {

          case 'BB8_CONNECTION_REQUEST':

            var device = await spheroSvc.connect(
              cmd.deviceId);

            // notify server of device status change
            socket.emit('IOT_DEVICE_MSG', {
              connected: device.connected,
              deviceId: device.deviceId,
              address: device.address,
              name: device.name
            });

            // notify caller
            socket.emit('IOT_COMMAND_RESULT', {
              tag: cmd.tag,
              status: 'device connected'
            });

            break;

          case 'ROLL':

          await spheroSvc.roll(
            cmd.deviceId,
            cmd.args.speed,
            cmd.args.heading);

            break;

          case 'HEADING':

          await spheroSvc.setHeading(
            cmd.deviceId,
            cmd.args.heading);

            break;

          case 'BLINK':

          await spheroSvc.blink(
            cmd.deviceId,
            (cmd.args.enabled == 'true' ? true : false),
            parseInt(cmd.args.period),
            parseInt("0x" + cmd.args.color));

            break;

          case 'PATH':

            var pathFn = null;

            switch (cmd.args.type) {

              case 'square':

                pathFn = spheroSvc.createSquarePathFn(
                  cmd.args.length,
                  cmd.args.speed);

                break;
            }

            if (pathFn) {

              await spheroSvc.startPath(
                cmd.deviceId,
                pathFn,
                cmd.args.speed,
                250);
            }
            else {

            await spheroSvc.stopPath(
              cmd.deviceId);
            }

            break;
        }
      }
      catch (ex) {

        console.log(ex);
      }
    });
  }
  catch(ex){

    console.log(ex);
  }
}

/////////////////////////////////////////////////////////////////////
//
//
/////////////////////////////////////////////////////////////////////
function initializeRoutes(app, server) {

  return new Promise(async(resolve, reject)=> {

    try {

      var svcManager = new ServiceManager();

      var socketSvc = new SocketSvc(svcManager);

      initializeSocket(socketSvc);

      app.use(express.static(path.resolve(
        __dirname, 'www')));

      resolve();
    }
    catch (ex) {

      reject(ex);
    }
  });
}

/////////////////////////////////////////////////////////////////////
//
//
/////////////////////////////////////////////////////////////////////
function createServer() {

  return new Promise(async(resolve, reject)=> {

    try {

      var app = express();

      var faviconPath = path.resolve(
        __dirname, 'www/img/favicon.ico');

      app.use(favicon(faviconPath));
      app.use(bodyParser.urlencoded({ extended: false }));
      app.use(bodyParser.json());
      app.use(cookieParser());

      app.set('port', process.env.PORT || config.controller.port);

      var server = app.listen(app.get('port'), async()=> {

        try {

          await initializeRoutes(app, server);

          resolve(server);
        }
        catch (ex) {

          reject(ex);
        }
      });
    }
    catch (ex){

      reject(ex);
    }
  });
}

/////////////////////////////////////////////////////////////////////
//
//
/////////////////////////////////////////////////////////////////////
async function runServer() {

  try {

    var server = await createServer();

    console.log('Server listening on: ');
    console.log(server.address());
    console.log('ENV: ' + process.env.NODE_ENV);
  }
  catch (ex) {

    console.log('Failed to run server... ');
    console.log(ex);
  }
}

runServer();

