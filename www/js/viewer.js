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

/////////////////////////////////////////////////////////////////////
// on html document loaded
//
/////////////////////////////////////////////////////////////////////
function onLoad() {

  var options = {
    language:'en', //default - en
    env: 'Local'
  };

  Autodesk.Viewing.Initializer (options, function () {

    var container = document.getElementById('viewer')

    var viewer = new Autodesk.Viewing.Private.GuiViewer3D(
      container);

    viewer.initialize();

    viewer.setLightPreset(8);
    viewer.setProgressiveRendering(false);

    viewer.load('/data/bb8/bb8.svf');

    viewer.loadExtension('Autodesk.ADN.Viewing.Extension.BB8', {
      cylonApiUrl: '/node/iot/bb8/api/cylon-bb8'
    });
  });
}