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
var Joystick = function(params) {

  var _thisJoystick = this;

  var opts = {

    baseCenter: params.baseCenter || {
      x: 116,
      y: 124
    },
    
    lineWidth: 2,
    baseRadius: 60,
    controllerRadius: 10,

    strokeStyle: params.strokeStyle	|| 'cyan',

    container: params.container || document.body
  }

  ///////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////
  function moveController(ctrl, x, y) {

    var dx = x - opts.baseCenter.x;
    var dy = y - opts.baseCenter.y;

    var dist =  Math.sqrt(dx * dx + dy * dy);

    //normalize distance from center
    var nx = x;
    var ny = y;

    var maxDist = opts.baseRadius - (opts.controllerRadius + 2);

    if(dist > maxDist) {

      nx = opts.baseCenter.x + dx * maxDist/dist;
      ny = opts.baseCenter.y + dy * maxDist/dist;
    }

    ctrl.style.left = (nx - ctrl.width / 2) + 'px';
    ctrl.style.top = (ny - ctrl.height / 2) + 'px';
  }

  ///////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////
	function createBase() {

		var canvas = document.createElement('canvas');

		canvas.width = opts.baseRadius * 2 + opts.lineWidth + 50;
		canvas.height = opts.baseRadius * 2 + opts.lineWidth + 50;

    canvas.style.left = (opts.baseCenter.x - canvas.width/2) + 'px';
    canvas.style.top = (opts.baseCenter.y - canvas.height/2) + 'px';
    canvas.style.position	= "absolute";

		var ctx = canvas.getContext('2d');
		ctx.beginPath();
		ctx.strokeStyle = opts.strokeStyle;
		ctx.lineWidth = opts.lineWidth;

		ctx.arc(
      canvas.width / 2,
      canvas.width / 2,
      opts.baseRadius -
      opts.controllerRadius -
      2 * opts.lineWidth,
      0, Math.PI * 2, true);

		ctx.stroke();

		ctx.beginPath();
		ctx.strokeStyle = opts.strokeStyle;
		ctx.lineWidth = 2;

		ctx.arc(
      canvas.width/2,
      canvas.width/2,
      opts.baseRadius, 0,
      Math.PI * 2, true);

		ctx.stroke();

		return canvas;
	}

  function createController()
  {
    var canvas	= document.createElement('canvas');

    canvas.width	= opts.controllerRadius * 2 + opts.lineWidth;
    canvas.height	= opts.controllerRadius * 2 + opts.lineWidth;

    canvas.style.pointerEvents = "none";
    canvas.style.position	= "absolute";

    var ctx = canvas.getContext('2d');

    ctx.beginPath();
    ctx.fillStyle = "cyan";
    ctx.strokeStyle = opts.strokeStyle;
    ctx.lineWidth = opts.lineWidth;

    ctx.arc(
      canvas.width/2,
      canvas.width/2,
      opts.controllerRadius, 0,
      Math.PI*2, true);

    ctx.closePath();
    ctx.fill();

    ctx.stroke();

    return canvas;
  }

  ///////////////////////////////////////////////////////////////////
  // microevents.js - https://github.com/jeromeetienne/microevent.js
  //
  ///////////////////////////////////////////////////////////////////
  function events(target) {

    target.addEventListener	= function(event, fct) {

      if(this._events === undefined) 	this._events	= {};
      this._events[event] = this._events[event]	|| [];
      this._events[event].push(fct);
      return fct;
    };

    target.removeEventListener = function(event, fct) {

      if(this._events === undefined) 	this._events	= {};
      if( event in this._events === false  )	return;
      this._events[event].splice(this._events[event].indexOf(fct), 1);
    };

    target.dispatchEvent = function(event /* , args... */) {

      if(this._events === undefined) 	this._events	= {};
      if( this._events[event] === undefined )	return;
      var tmpArray	= this._events[event].slice();
      for(var i = 0; i < tmpArray.length; i++){
        var result	= tmpArray[i].apply(this,
          Array.prototype.slice.call(arguments, 1))
        if( result !== undefined )	return result;
      }
      return undefined
    };
  }

  function parseStyleInt(value){
    return parseInt(value.replace('px', ''), 10);
  }

  function onDelta() {

    if(_activated) {

      var dx = parseStyleInt(_base.style.left) + _base.width / 2 -
        (parseStyleInt(_controller.style.left) + _controller.width / 2);

      var dy = parseStyleInt(_base.style.top) + _base.height / 2 -
        (parseStyleInt(_controller.style.top) + _controller.height / 2);

      var maxDist = opts.baseRadius - opts.controllerRadius;

      _thisJoystick.dispatchEvent('delta', {
        x: dx / maxDist,
        y: dy / maxDist
      });
    }
  }

  var trackId = 0;

  var _activated = false;

  function trackDelta() {

      trackId = requestAnimationFrame(trackDelta);

      onDelta();
  }

  function deactivate() {

    if(_activated) {

      _activated = false;

      cancelAnimationFrame(trackId);

      trackId = 0;

      moveController(_controller,
        opts.baseCenter.x,
        opts.baseCenter.y);

      _thisJoystick.dispatchEvent(
        'deactivate');
    }
  }

  function onMouseDown(event) {

    event.preventDefault();

    var offset = $(opts.container).offset();

    var x	= event.clientX - offset.left;
    var y	= event.clientY - offset.top + 1.5 * _controller.height;

    moveController(_controller, x, y);

    _activated = true;

    requestAnimationFrame(trackDelta);
  }

  function onMouseUp() {

    deactivate();
  }

  function onMouseMove(event) {

    if(_activated){

      event.preventDefault();

      var offset = $(opts.container).offset();

      var x	= event.clientX - offset.left;
      var y	= event.clientY - offset.top + 1.5 * _controller.height;

      moveController(_controller, x, y);
    }
  }

  function onMouseLeave(event) {

    deactivate();
  }

  ///////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////
  var _base = createBase();
  var _controller = createController();

  moveController(_controller,
    opts.baseCenter.x,
    opts.baseCenter.y);

  opts.container.appendChild(_base);
  opts.container.appendChild(_controller);

  _base.addEventListener('mousedown',
    onMouseDown,
    false);

  _base.addEventListener('mouseup',
    onMouseUp,
    false);

  _base.addEventListener('mousemove',
    onMouseMove,
    false);

  _base.addEventListener('mouseleave',
    onMouseLeave,
    false);

  events(this);
}
