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
import io from 'socket.io';
import EventEmitter from 'events';

/////////////////////////////////////////////////////////////////////
// IoTSvc Service: uses socket.io to wait for incoming controller
// connections and keep track of them.
//
// Exposes methods to use on the server API to easily interact and
// send commands to the controllers
//
/////////////////////////////////////////////////////////////////////
class IoTSvc extends EventEmitter {

  ///////////////////////////////////////////////////////////////////
  // Constructor
  //
  ///////////////////////////////////////////////////////////////////
  constructor(server) {

    super();

    this.handleConnection =
      this.handleConnection.bind(this);

    this.io = io(server);

    this.io.sockets.on(
      'connection',
      this.handleConnection);

    this.controllerInfoCollection = {};
  }

  ///////////////////////////////////////////////////////////////////
  // Generate GUID
  //
  ///////////////////////////////////////////////////////////////////
  guid() {

    var d = new Date().getTime();

    var guid = 'xxxxxxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
      });

    return guid;
  }

  ///////////////////////////////////////////////////////////////////
  // Socket Connection handler
  //
  ///////////////////////////////////////////////////////////////////
  handleConnection(socket) {

    var _thisSvc = this;

    socket.on('IOT_CLIENT_READY', (data)=> {

      if(data.type === 'IOT_CONTROLLER'){

        _thisSvc.onControllerConnected(
          socket, data);
      }
    });
  }

  ///////////////////////////////////////////////////////////////////
  // Controller connected handler
  //
  ///////////////////////////////////////////////////////////////////
  onControllerConnected(socket, data) {

    var _thisSvc = this;

    var controllerId = _thisSvc.guid();

    var controllerInfo = {

      controllerId: controllerId,
      name: data.name,
      deviceInfoCollection: {},
      socket: socket
    };

    _thisSvc.controllerInfoCollection[controllerId] =
      controllerInfo;

    socket.emit('IOT_SCAN_REQUEST', {scanTimeout: 30000});

    socket.on('IOT_DEVICE_MSG', (device)=> {

      device.controllerId = controllerId;

      controllerInfo.deviceInfoCollection[device.deviceId] =
        device;

      _thisSvc.emit('IOT_DEVICE_MSG', device);
    });

    socket.on('disconnect', ()=> {

      _thisSvc.onControllerDisconnected(controllerId);
    });

    _thisSvc.emit('IOT_CONTROLLER_CONNECTED',
      controllerId);
  }

  ///////////////////////////////////////////////////////////////////
  // Controller disconnected
  //
  ///////////////////////////////////////////////////////////////////
  onControllerDisconnected(controllerId) {

    var _thisSvc = this;

    if(!_thisSvc.controllerInfoCollection[controllerId]){

      console.log('Invalid controllerId: ' + controllerId);
      return;
    }

    _thisSvc.controllerInfoCollection[controllerId] = null;

    delete _thisSvc.controllerInfoCollection[controllerId];

    _thisSvc.emit('IOT_CONTROLLER_DISCONNECTED',
      controllerId);
  }

  ///////////////////////////////////////////////////////////////////
  // Sends command to specific controller
  //
  ///////////////////////////////////////////////////////////////////
  sendCommand(controllerId, cmd) {

    var _thisSvc = this;

    var promise = new Promise((resolve, reject)=> {

      if (!_thisSvc.controllerInfoCollection[controllerId]) {

        return reject('Invalid controllerId: ' + controllerId);
      }

      var controllerInfo =
        _thisSvc.controllerInfoCollection[controllerId];

      if(cmd.requestResult) {

        cmd.tag = _thisSvc.guid();

        function resultHandler(result) {
          if (result.tag == cmd.tag) {
            resolve(result);
          }
        }

        controllerInfo.socket.on(
          'IOT_COMMAND_RESULT', (result)=> {
            controllerInfo.socket.removeListener(
              'IOT_COMMAND_RESULT', resultHandler);
            resultHandler(result)
          });
      }

      controllerInfo.socket.emit(
        'IOT_COMMAND',
        cmd);
    });

    return promise;
  }

  ///////////////////////////////////////////////////////////////////
  // Returns list of connected controllers
  //
  ///////////////////////////////////////////////////////////////////
  getConnectedControllers() {

    var _thisSvc = this;

    var controllerList = [];

    for(var controllerId in _thisSvc.controllerInfoCollection) {

      var controllerInfo =
        _thisSvc.controllerInfoCollection[controllerId];

        controllerList.push({
          controllerId: controllerInfo.controllerId,
          name: controllerInfo.name
        });
    }

    return controllerList;
  }

  ///////////////////////////////////////////////////////////////////
  // Returns list of devices available for specific controller
  //
  ///////////////////////////////////////////////////////////////////
  getAvailableDevices(controllerId) {

    var _thisSvc = this;

    var deviceList = [];

    var controllerInfo =
      _thisSvc.controllerInfoCollection[controllerId];

    for(var deviceId in controllerInfo.deviceInfoCollection) {

      var deviceInfo =
        controllerInfo.deviceInfoCollection[deviceId];

      deviceList.push({
        connected: deviceInfo.connected,
        deviceId: deviceInfo.deviceId,
        address: deviceInfo.address,
        name: deviceInfo.name
      });
    }

    return deviceList;
  }
}

export default IoTSvc;
