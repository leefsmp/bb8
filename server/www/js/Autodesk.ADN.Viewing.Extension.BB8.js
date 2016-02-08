/////////////////////////////////////////////////////////////////////
// Autodesk.ADN.Viewing.Extension.BB8
// by Philippe Leefsma, May 2015
//
/////////////////////////////////////////////////////////////////////
AutodeskNamespace("Autodesk.ADN.Viewing.Extension");

Autodesk.ADN.Viewing.Extension.BB8 = function (viewer, options) {

  Autodesk.Viewing.Extension.call(this, viewer, options);

  /////////////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////////////

  var _fragIds = [
    1, 2, 3, 4, 5, 6, 7, 8 ,9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19
  ];

  /////////////////////////////////////////////////////////////////
  // Extension load callback
  //
  /////////////////////////////////////////////////////////////////
  this.load = function () {

    viewer.addEventListener(
      Autodesk.Viewing.SELECTION_CHANGED_EVENT,
      onItemSelected);

    console.log('Autodesk.ADN.Viewing.Extension.BB8 loaded');

    return true;
  }

  /////////////////////////////////////////////////////////////////
  //  Extension unload callback
  //
  /////////////////////////////////////////////////////////////////
  this.unload = function () {
    
    console.log('Autodesk.ADN.Viewing.Extension.BB8 unloaded');

    return true;
  }

  /////////////////////////////////////////////////////////////////
  //  connect bb8 device
  //
  /////////////////////////////////////////////////////////////////
  this.connect = function(controllerId, deviceId, name) {

    var panel = new BB8ControlPanel(
      viewer.container,
      guid(),
      controllerId,
      deviceId,
      name);

    panel.connect();
  }

  ///////////////////////////////////////////////////////////////////////////
  // item selected callback
  //
  ///////////////////////////////////////////////////////////////////////////
  function onItemSelected(event) {

    //prevents selecting the ground
    if(event.fragIdsArray[0] == 0){
      viewer.select([]);
    }
  }

  /////////////////////////////////////////////////////////////////
  // Offset specific fragment
  //
  /////////////////////////////////////////////////////////////////
  function offsetFragment(fragId, offset){

    var fragProxy = viewer.impl.getFragmentProxy(
      viewer.model,
      fragId);

    fragProxy.getAnimTransform();

    var position = new THREE.Vector3(
      fragProxy.position.x + offset.x,
      fragProxy.position.y + offset.y,
      fragProxy.position.z + offset.z);

    fragProxy.position = position;

    fragProxy.updateAnimTransform();
  }

  /////////////////////////////////////////////////////////////////
  // Generates random guid to use as DOM id
  //
  /////////////////////////////////////////////////////////////////
  function guid() {

    var d = new Date().getTime();

    var guid = 'xxxx-xxxx-xxxx-xxxx'.replace(
      /[xy]/g,
      function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
      });

    return guid;
  }

  /////////////////////////////////////////////////////////////////
  // The demo Panel
  //
  /////////////////////////////////////////////////////////////////
  var BB8ControlPanel = function(
    parentContainer, 
    id, 
    controllerId, 
    deviceId,
    deviceName) {
  
    /////////////////////////////////////////////////////////////////
    // BB8 API
    //
    /////////////////////////////////////////////////////////////////
    var BB8API = {

      connect: function() {

        var url = options.apiUrl + '/bb8/connect/' +
          controllerId + '/' + deviceId;

        return new Promise(
          function (resolve, reject) {
            $.get(url, function (response) {
              resolve(response);
            });
          });
      },

      blink: function(enabled, period, color) {
      
        var url = options.apiUrl + '/bb8/blink/' +
          controllerId + '/' + deviceId + '/' +
          enabled + '/' + period + '/' + color;
      
        return new Promise(
          function (resolve, reject) {
            $.get(url, function (response) {
              resolve(response);
            });
          });
      },
    
      setHeading: function(heading) {
      
        var url = options.apiUrl + '/bb8/heading/' +
          controllerId + '/' + deviceId + '/' +
          heading;
      
        return new Promise(
          function (resolve, reject) {
            $.get(url, function (response) {
              resolve(response);
            });
          });
      },
    
      roll: function(speed, heading) {
      
        var url = options.apiUrl + '/bb8/roll/' +
          controllerId + '/' + deviceId + '/' +
          speed + '/' + heading;
      
        return new Promise(
          function (resolve, reject) {
            $.get(url, function (response) {
              resolve(response);
            });
          });
      },

      path: function(speed, type) {

        var url = options.apiUrl + '/bb8/path/' +
          controllerId + '/' + deviceId + '/' +
          speed + '/' + type;

        return new Promise(
          function (resolve, reject) {
            $.get(url, function (response) {
              resolve(response);
            });
          });
      }
    }
  
    /////////////////////////////////////////////////////////////////
    // 
    //
    /////////////////////////////////////////////////////////////////
    var _thisPanel = this;

    _thisPanel.content = document.createElement('div');

    Autodesk.Viewing.UI.DockingPanel.call(
      this,
      parentContainer,
      id,
      'Device: ' + deviceName,
      {shadow:true});

    $(_thisPanel.container).addClass('bb8-panel');

    /////////////////////////////////////////////////////////////
    // Custom html
    //
    /////////////////////////////////////////////////////////////
    var html = [

      '<div class="joystick-container" id="joystick-' + id + '">',
      '</div>',

      '<hr class="spacer">',

      '<div class="bb8-panel-controls">',

        '<span class="speed-label">Speed:</span>',
        '<input class="speed-control" id="speed-range-' + id + '" ',
          'type ="range" min ="1" max="2000" step ="10" value="1">',

        '<hr class="spacer">',

        '<span class="heading-label">Heading:</span>',
        '<input class="heading-control" id="heading-range-' + id + '" ',
          'type ="range" min ="0" max="359" step ="1" value="0">',

        '<hr class="spacer">',

        '<div class="bb8-panel-light-controls">',
          '<span class="light-label">Light:</span>',
          '<div id="onoffswitch-' + id + '" class="onoffswitch-container">',
          '</div>',
          '<input type="text" id="spectrum-' + id + '"/>',
          '<hr class="spacer">',
          '<input class="light-control" id="light-range-' + id + '" ',
            'type ="range" min ="0" max="3000" step ="100" value="0">',
        '</div>',

        '<hr class="spacer">',

        '<div class="bb8-panel-path-controls">',
        '<div>Path:</div>',
          '<button class="btn btn-info bb8-panel-btn-path fa fa-square-o" id="' + id + '-square-path-btn">',
          '<button class="btn btn-info bb8-panel-btn-path fa fa-circle-o" id="' + id + '-circle-path-btn">',
        '</div>',

      '</div>'
    ];

    $(_thisPanel.container).append(html.join('\n'));

    var pathRunning = false;

    $('#' + id + '-square-path-btn').click(function(){

      pathRunning = !pathRunning;

      if(!pathRunning) {

        BB8API.path(0, 'stop');
        return;
      }

      var speedFactor = document.getElementById(
        'speed-range-' + id).value;

      var speed = speedFactor * 0.1;

      BB8API.path(speed, 'square');
    });

    $('#' + id + '-circle-path-btn').click(function(){

      var speedFactor = document.getElementById(
        'speed-range-' + id).value;

      var speed = speedFactor * 0.1;

      BB8API.path(speed, 'circle');
    });

    /////////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////////
    _thisPanel.connect = function() {

      BB8API.connect().then(function(){

        _thisPanel.setVisible(true);
      });
    }

    /////////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////////
    function createSwitchButton(parent, checked, onChanged) {

      var inputId = guid();

      var labelId = guid();

      var html = [
        '<div class="onoffswitch">',
          '<input id="' + inputId + '" type="checkbox" name="onoffswitch"',
          'class="onoffswitch-checkbox" ' + (checked ? "checked" : "") + '>',
          '<label id="' + labelId + '" class="onoffswitch-label" for="myonoffswitch">',
            '<span class="onoffswitch-inner"></span>',
            '<span class="onoffswitch-switch"></span>',
          '</label>',
        '</div>'
      ];

      $(parent).append(html.join('\n'));

      $('#' + labelId).click(function(e){

        var input = $('#' + inputId)[0];

        input.checked = !input.checked;

        onChanged(input.checked);
      });
    }

    /////////////////////////////////////////////////////////////
    // Throttled function from remy sharp's b:log
    // https://remysharp.com/2010/07/21/throttling-function-calls
    //
    /////////////////////////////////////////////////////////////
    function throttle(fn, threshhold) {
      threshhold || (threshhold = 250);
      var last, deferTimer;
      return function () {
        var context = this;
        var now = +new Date, args = arguments;
        if (last && now < last + threshhold) {
          clearTimeout(deferTimer);
          deferTimer = setTimeout(function () {
            last = now;
            fn.apply(context, args);
          }, threshhold);
        } else {
          last = now;
          fn.apply(context, args);
        }
      };
    }

    /////////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////////
    function createControls() {

      var joystick = new Joystick({
          baseCenter: { x: 116, y: 124 },
          container:  $('#joystick-' + id)[0]
        });

      var throttledRoll = throttle(BB8API.roll, 250);

      joystick.addEventListener('delta', function(delta) {

        var speed = Math.sqrt(
          delta.x * delta.x +
          delta.y * delta.y);

        var angleRad = (Math.atan2(delta.y, delta.x) + Math.PI);

        var speedFactor =
          document.getElementById('speed-range-' + id).value;

        // compensate heading to align 0 with up direction
        var heading = ((angleRad * 180/Math.PI) + 90) % 360;

        throttledRoll(speedFactor * speed, heading);

        //update viewer model
        _fragIds.forEach(function(fragId){
          offsetFragment(fragId,{
            x: delta.x * speedFactor * 0.01,
            y: 0,
            z: delta.y * speedFactor * 0.01
          });
        });

        viewer.impl.sceneUpdated(true);
      });

      joystick.addEventListener('deactivate', function() {

        setTimeout(function() {
          BB8API.roll(0, 0)
        }, 300);
      });

      $('#heading-range-' + id).change(function(){

        BB8API.setHeading(this.value);
      });

      var blinkEnabled = false;
      var blinkPeriod = 0;
      var blinkColor = 'FF';

      createSwitchButton('#onoffswitch-' + id, false,
        function(checked){

          blinkEnabled = checked;

          BB8API.blink(
            blinkEnabled,
            blinkPeriod,
            blinkColor);
        });

      $("#spectrum-" + id).spectrum({
        color: '#0000FF',
        change: function (color) {

          var lightColor = color.toHexString();

          $('<style type="text/css">' +
            '.onoffswitch-inner:before{' +
            'background-color:' + lightColor + ';' +
            '}' +
          '</style>').appendTo('head');

          blinkColor = lightColor.replace('#', '');

          BB8API.blink(
            blinkEnabled,
            blinkPeriod,
            blinkColor);
        }
      });

      $('#light-range-' + id).change(function(){

        blinkPeriod = parseInt(this.value);

        BB8API.blink(
          blinkEnabled,
          blinkPeriod,
          blinkColor);
      });
    }

    /////////////////////////////////////////////////////////////
    // setVisible override (not used in that sample)
    //
    /////////////////////////////////////////////////////////////
    _thisPanel.setVisible = function(show) {

      Autodesk.Viewing.UI.DockingPanel.prototype.
        setVisible.call(this, show);

      createControls();
    }

    /////////////////////////////////////////////////////////////
    // initialize override
    //
    /////////////////////////////////////////////////////////////
    _thisPanel.initialize = function() {

      this.title = this.createTitleBar(
        this.titleLabel ||
        this.container.id);

      this.closer = this.createCloseButton();

      this.container.appendChild(this.title);
      this.title.appendChild(this.closer);
      this.container.appendChild(this.content);

      this.initializeMoveHandlers(this.title);
      this.initializeCloseHandler(this.closer);
    }

    /////////////////////////////////////////////////////////////
    // onTitleDoubleClick override
    //
    /////////////////////////////////////////////////////////////
    var _isMinimized = false;

    _thisPanel.onTitleDoubleClick = function (event) {

      _isMinimized = !_isMinimized;

      if(_isMinimized) {

        $(_thisPanel.container).addClass(
          'bb8-panel-minimized');
      }
      else {
        $(_thisPanel.container).removeClass(
          'bb8-panel-minimized');
      }
    }
  };

  /////////////////////////////////////////////////////////////
  // Set up JS inheritance
  //
  /////////////////////////////////////////////////////////////
  BB8ControlPanel.prototype = Object.create(
    Autodesk.Viewing.UI.DockingPanel.prototype);
  
  BB8ControlPanel.prototype.constructor = BB8ControlPanel;

  /////////////////////////////////////////////////////////////
  // Add needed CSS
  //
  /////////////////////////////////////////////////////////////
  var css = [

    'div.bb8-panel {',
      'top: 0px;',
      'right: 0px;',
      'width: 245px;',
      'height: 415px;',
      'resize: auto;',
    '}',

    '.bb8-panel-controls {',
      'margin: 10px;',
    '}',

    'div.bb8-panel-minimized {',
      'height: 34px;',
      'min-height: 34px',
    '}',

    '.joystick-container {',
      'margin-bottom: 172px;',
    '}',

    'div.bb8-panel-light-controls {',
      'margin-left: 20px;',
      'margin-right: 20px;',
    '}',

    '.onoffswitch-container {',
      'margin-right:5px;',
      'float:left;',
    '}',

    '.speed-label {',
      'float: left;',
      'color: whitesmoke;',
      'margin-left: 10px;',
    '}',

    '.speed-control{',
      'width: calc(100% - 102px);',
    '}',

    '.heading-label {',
      'float: left;',
      'margin-left: 10px;',
      'color: whitesmoke;',
    '}',

    '.heading-control{',
      'width: calc(100% - 102px);',
    '}',

    '.light-label{',
      'float: left;',
      'margin-right: 10px;',
      'color: whitesmoke;',
      'margin-top: 6px;',
    '}',

    '.light-control{',
      'width:100%;',
    '}',

    'hr.spacer{',
      'border-width: 0px;',
      'margin: 5px;',
    '}',

    '.bb8-panel-path-controls {',
      'margin-top: 10px;',
      'color: white;',
    '}',

    '.bb8-panel-btn-path {',
      'margin-right: 10px;',
      'margin-top: 5px;',
    '}'

  ].join('\n');

  $('<style type="text/css">' + css + '</style>').appendTo('head');
};

Autodesk.ADN.Viewing.Extension.BB8.prototype =
  Object.create(Autodesk.Viewing.Extension.prototype);

Autodesk.ADN.Viewing.Extension.BB8.prototype.constructor =
  Autodesk.ADN.Viewing.Extension.BB8;

Autodesk.Viewing.theExtensionManager.registerExtension(
  'Autodesk.ADN.Viewing.Extension.BB8',
  Autodesk.ADN.Viewing.Extension.BB8);