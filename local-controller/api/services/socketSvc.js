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

import EventEmitter from 'events';
import ioClient from 'socket.io-client';

///////////////////////////////////////////////////////////////////
// SocketSvc Service:
//
///////////////////////////////////////////////////////////////////
export default class SocketSvc extends EventEmitter {

  /////////////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////////////
  constructor(svcManager) {

    super();

    this._connections = {};

    svcManager.registerService(this);

    this._svcManager = svcManager;
  }

  /////////////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////////////
  name() {

    return 'SocketSvc';
  }

  /////////////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////////////
  listen(server) {

    this.handleConnection =
      this.handleConnection.bind(this);

    this.handleDisconnection =
      this.handleDisconnection.bind(this);

    this._io = io(server);

    this._io.sockets.on(
      'connection',
      this.handleConnection);
  }

  /////////////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////////////
  connect(url) {

    return new Promise((resolve, reject)=> {

      try{

        var socket = ioClient.connect(url, {
          reconnect: true
        });

        socket.on('connect', ()=> {

          return resolve(socket);
        });
      }
      catch(ex){

        reject(ex);
      }
    });
  }

  ///////////////////////////////////////////////////////////////////
  // Socket Connection handler
  //
  ///////////////////////////////////////////////////////////////////
  handleConnection(socket) {

    var _thisSvc = this;

    _thisSvc._connections[socket.id] = socket;

    socket.on('disconnect', ()=> {

      _thisSvc.handleDisconnection(socket.id);
    });

    _thisSvc.emit('SocketSvc.Connection', {
      id: socket.id
    });

    console.log('Incoming socket connection: ' + socket.id);
  }

  ///////////////////////////////////////////////////////////////////
  // Socket Disconnection handler
  //
  ///////////////////////////////////////////////////////////////////
  handleDisconnection(id) {

    var _thisSvc = this;

    _thisSvc.emit('SocketSvc.Disconnection', {
      id: id
    });

    if(_thisSvc._connections[id]){

      delete _thisSvc._connections[id]
    }
  }

  ///////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////
  broadcast(msgId, msg, filter) {

    var _thisSvc = this;

    for(var socketId in _thisSvc._connections){

      var socket = _thisSvc._connections[socketId];

      socket.emit(msgId, msg);
    }
  }
}
