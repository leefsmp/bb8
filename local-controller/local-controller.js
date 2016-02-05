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
import ioClient from 'socket.io-client';
import config from '../config/config';
import BB8Svc from './services/bb8Svc';

/////////////////////////////////////////////////////////////////////
// Initialization
//
/////////////////////////////////////////////////////////////////////
var socket = ioClient.connect(
  `${config.controller.host}:${config.port}`, {
    reconnect: true
  });

var bb8Svc = new BB8Svc();

/////////////////////////////////////////////////////////////////////
// Socket connected
//
/////////////////////////////////////////////////////////////////////
socket.on('connect', ()=> {

  console.log('Local controller connected');
});

/////////////////////////////////////////////////////////////////////
// Type request, controller replies with info
//
/////////////////////////////////////////////////////////////////////
socket.on('IOT_TYPE_REQUEST', (data)=> {

  socket.emit('IOT_TYPE_REPLY', {
    type: 'IOT_CONTROLLER',
    name: config.controller.name
  });
});

/////////////////////////////////////////////////////////////////////
// Scan request, controller scans local BLE devices
//
/////////////////////////////////////////////////////////////////////
socket.on('IOT_SCAN_REQUEST', (data)=> {

  console.log('Scanning for devices ...\n');

  bb8Svc.scan(data.scanTimeout);
});

bb8Svc.on('DEVICE_DETECTED', (device)=>{

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

/////////////////////////////////////////////////////////////////////
// Process various IoT command from server
//
/////////////////////////////////////////////////////////////////////
socket.on('IOT_COMMAND', async(cmd) => {

  console.log('IOT_COMMAND received:');
  console.log(cmd);

  try {

    switch(cmd.cmdId) {

      case 'BB8_CONNECTION_REQUEST':

        var device = await bb8Svc.connect(
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

        await bb8Svc.roll(cmd.deviceId,
          cmd.args.speed,
          cmd.args.heading);

        break;

      case 'HEADING':

        await bb8Svc.setHeading(cmd.deviceId,
          cmd.args.heading);

        break;

      case 'COLOR':

        await bb8Svc.color(cmd.deviceId,
          cmd.args.color);

        break;
    }
  }
  catch(ex) {

    console.log(ex);
  }
});

