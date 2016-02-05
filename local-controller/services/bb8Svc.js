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
import sphero from 'sphero';
import EventEmitter from 'events';

export default class BB8Svc extends EventEmitter {

  ///////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////
  constructor() {

    super();

    this.detectedDevices = {};
  }

  ///////////////////////////////////////////////////////////////////
  // Scan for local BLE BB8 devices
  //
  ///////////////////////////////////////////////////////////////////
  scan(scanTimeout) {

    var _thisSvc = this;

    noble.on('discover', function(peripheral) {

      var deviceId = peripheral.id;
      var address = peripheral.address;
      var name = peripheral.advertisement.localName;

      if(name && name.startsWith('BB-')) {

        var blinker = new Blinker(_thisSvc, deviceId);

        var device = {
          deviceId: deviceId,
          connected: false,
          address: address,
          name: name,
          blinker: blinker
        };

        _thisSvc.emit('DEVICE_DETECTED', device);

        _thisSvc.detectedDevices[deviceId] = device;
      }
    });

    function _startScan(){

      noble.startScanning();

      //scan for 30 sec ...
      setTimeout(()=>{
        console.log('Stop scanning');
        noble.stopScanning();
      }, scanTimeout || 30000);
    }

    try {

      // returns already connected devices as they wont
      // appear in the scan
      for(var deviceId in _thisSvc.detectedDevices) {

        var device = _thisSvc.detectedDevices[deviceId];

        if(device.connected){

          _thisSvc.emit('DEVICE_DETECTED', device);
        }
      }

      _startScan();
    }
    catch (ex){

      noble.on('stateChange', function(state) {

        if (state === 'poweredOn') {

          _startScan();
        }
        else {
          console.log('Stop scanning');
          noble.stopScanning();
        }
      });
    }
  }

  ///////////////////////////////////////////////////////////////////
  // Returns device by id
  //
  ///////////////////////////////////////////////////////////////////
  getDeviceById(deviceId) {

    var _thisSvc = this;

    if(_thisSvc.detectedDevices[deviceId]){

      return _thisSvc.detectedDevices[deviceId];
    }

    return null;
  }

  ///////////////////////////////////////////////////////////////////
  // Connects device by BLE id
  // Returns device if already connected
  //
  ///////////////////////////////////////////////////////////////////
  connect(deviceId) {

   var _thisSvc = this;

    function _onConnect(driver){

      driver.color(0x0000FF);

      setTimeout(function () {
        driver.color(0x00);
      }, 3000);
    }

    var promise = new Promise((resolve, reject)=> {

      try {

        if(!_thisSvc.detectedDevices[deviceId]) {

          reject('Invalid device id');
        }

        var device = _thisSvc.detectedDevices[deviceId];

        if(device.connected && device.driver !== null){

          _onConnect(device.driver);

          return resolve(device);
        }

        var driver = sphero(deviceId);

        driver.connect(()=> {

          console.log('BB8 device connected: ' +
            deviceId);

          _onConnect(driver);

          // collision handler
          driver.on("collision", (data)=> {

            driver.color(0xFF0000);

            driver.stop(function () {

              setTimeout(function () {
                driver.color(0x00);
              }, 1000);
            });
          });

          // Activate collision
          driver.detectCollisions();

          // Auto stop the Sphero when it detects it
          // has become disconnected
          driver.stopOnDisconnect();

          _thisSvc.detectedDevices[deviceId].connected = true;
          _thisSvc.detectedDevices[deviceId].driver = driver;

          return resolve(_thisSvc.detectedDevices[deviceId]);
        });

        //kicks the connection
        noble.startScanning();
      }
      catch (ex) {

        reject(ex);
      }
    });

    return promise;
  }

  ///////////////////////////////////////////////////////////////////
  // Roll device
  //
  ///////////////////////////////////////////////////////////////////
  roll(deviceId, speed, heading) {

    var _thisSvc = this;

    var promise = new Promise((resolve, reject)=> {

      try {

        var device = _thisSvc.getDeviceById(deviceId);

        if (!device) {

          return reject('Invalid deviceId');
        }

        device.driver.roll(speed, heading, ()=>{

          resolve('done');
        });
      }
      catch (ex) {

        return reject(ex);
      }
    });

    return promise;
  }

  ///////////////////////////////////////////////////////////////////
  // Set device heading
  //
  ///////////////////////////////////////////////////////////////////
  setHeading(deviceId, heading) {

    var _thisSvc = this;

    var promise = new Promise((resolve, reject)=> {

      try {

        var device = _thisSvc.getDeviceById(deviceId);

        if (!device) {

          return reject('Invalid deviceId');
        }

        device.driver.roll(0, heading, 2, ()=> {
          setTimeout(()=> {
            device.driver.setHeading(0, ()=> {
              device.driver.roll(0, 0, 1, ()=> {
                resolve('done');
              });
            });
          }, 300);
        });

        //device.driver.setBackLed(255);
      }
      catch (ex) {

        return reject(ex);
      }
    });

    return promise;
  }

  ///////////////////////////////////////////////////////////////////
  // Set LED color
  //
  ///////////////////////////////////////////////////////////////////
  color(deviceId, color) {

    var _thisSvc = this;

    var promise = new Promise((resolve, reject)=> {

      try {

        var device = _thisSvc.getDeviceById(deviceId);

        if (!device) {

          return reject('Invalid deviceId');
        }

        device.driver.color(color, ()=>{

          resolve('done');
        });
      }
      catch (ex) {

        return reject(ex);
      }
    });

    return promise;
  }

  ///////////////////////////////////////////////////////////////////
  // Blink LED
  //
  ///////////////////////////////////////////////////////////////////
  blink(deviceId, enabled, period, color) {

    var _thisSvc = this;

    var promise = new Promise((resolve, reject)=> {

      try {

        var device = _thisSvc.getDeviceById(deviceId);

        if (!device) {

          return reject('Invalid deviceId');
        }

        device.blinker.setPeriod(period);
        device.blinker.setColor(color);
        device.blinker.enable(enabled);

        resolve('done');
      }
      catch (ex) {

        return reject(ex);
      }
    });

    return promise;
  }
}

///////////////////////////////////////////////////////////////////
// Utility to blink the LED
//
///////////////////////////////////////////////////////////////////
function Blinker(bb8Svc, deviceId) {

  var _blinker = this;

  _blinker.color = 0;

  _blinker.intervalId = 0;

  _blinker.enabled = false;

  _blinker.period = 0;

  function blink(color) {

    bb8Svc.color(deviceId, color);

    setTimeout(function() {
      bb8Svc.color(deviceId, 0);
    }, 50);
  }

  function run() {

    clearInterval(_blinker.intervalId);

    if(_blinker.enabled) {

      if(_blinker.period > 0) {

        _blinker.intervalId = setInterval(
          function () {
            blink(_blinker.color);
          }, _blinker.period);
      }
      else {

        bb8Svc.color(
          deviceId,
          _blinker.color);
      }
    }
    else {

      bb8Svc.color(deviceId, 0);
    }
  }

  _blinker.enable = function(enabled){

    _blinker.enabled = enabled;

    run();
  }

  _blinker.setPeriod = function(t) {

    _blinker.period = t;

    run();
  }

  _blinker.setColor = function(color){

    _blinker.color = color;

    if(_blinker.period == 0 && _blinker.enabled) {

      bb8Svc.color(
        deviceId,
        _blinker.color);
    }
  }
}