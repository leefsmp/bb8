/////////////////////////////////////////////////////////////////////
// Autodesk.ADN.Viewing.Extension.IoT
// by Philippe Leefsma, May 2015
//
/////////////////////////////////////////////////////////////////////
AutodeskNamespace("Autodesk.ADN.Viewing.Extension");

Autodesk.ADN.Viewing.Extension.IoT = function (viewer, options) {
  
  Autodesk.Viewing.Extension.call(this, viewer, options);

  /////////////////////////////////////////////////////////////////
  // IoT API wrapper
  //
  /////////////////////////////////////////////////////////////////
  var IoTAPI = {

    getControllers: function () {

      var url = options.apiUrl + '/iot/controllers';

      return new Promise(
        function (resolve, reject) {
          $.get(url, function (response) {
            resolve(response);
          });
        });
    },

    getDevices: function (controllerId) {

      var url = options.apiUrl + '/iot/devices/' +
        controllerId;

      return new Promise(
        function (resolve, reject) {
          $.get(url, function (response) {
            resolve(response);
          });
        });
    }
  }
  
  /////////////////////////////////////////////////////////////////
  // Extension load callback
  //
  /////////////////////////////////////////////////////////////////

  var _panel = null;

  var _bb8Extension = null;

  this.load = function () {

    viewer.loadExtension('Autodesk.ADN.Viewing.Extension.BB8', {
      apiUrl: options.apiUrl
    });

    _bb8Extension = viewer.getExtension(
      'Autodesk.ADN.Viewing.Extension.BB8');

    var button = createButton("IoTBtn",
      "fa fa-cogs",
      "IoT Control Panel", function(){

        _panel.toggleVisibility();
      });

    _panel = new Panel(
      viewer.container,
      guid(),
      button.container);

    var viewerToolbar = viewer.getToolbar(true);

    var ctrlGroup = new Autodesk.Viewing.UI.ControlGroup(
      "Autodesk.ADN.Viewing.Extension.IoT");

    ctrlGroup.addControl(button, {index:1});

    viewerToolbar.addControl(ctrlGroup);

    console.log('Autodesk.ADN.Viewing.Extension.IoT loaded');
    
    return true;
  }
  
  /////////////////////////////////////////////////////////////////
  //  Extension unload callback
  //
  /////////////////////////////////////////////////////////////////
  this.unload = function () {
    
    _panel.setVisible(false);
    
    console.log('Autodesk.ADN.Viewing.Extension.IoT unloaded');
    
    return true;
  }

  /////////////////////////////////////////////////////////////////
  // toolbar button
  //
  /////////////////////////////////////////////////////////////////
  function createButton(id, className, tooltip, handler) {

    var button = new Autodesk.Viewing.UI.Button(id);

    button.icon.style.fontSize = "24px";

    button.icon.className = className;

    button.setToolTip(tooltip);

    button.onClick = handler;

    return button;
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
  var Panel = function(
    parentContainer, id, button) {
    
    var _thisPanel = this;

    _thisPanel.isVisible = false;
    
    _thisPanel.content = document.createElement('div');
    
    Autodesk.Viewing.UI.DockingPanel.call(
      this,
      parentContainer,
      id,
      'IoT Connected Controllers',
      {shadow:true});
    
    $(_thisPanel.container).addClass('IoT-panel');
    
    /////////////////////////////////////////////////////////////
    // Custom html
    //
    /////////////////////////////////////////////////////////////
    var html = [
      
      '<div>',
        //'<input type="text" placeholder="Search">',
        '<div class="IoT-panel-treeview-container">',
        '</div>',
      '</div>'
    ];
    
    $(_thisPanel.container).append(html.join('\n'));

    /////////////////////////////////////////////////////////////
    // load controllers treeview
    //
    /////////////////////////////////////////////////////////////
    function loadTree() {

      var data = [];

      IoTAPI.getControllers().then(function(controllers) {

        async.each(controllers, function (controller, callback) {

          var controllerNode = {
            controllerId: controller.controllerId,
            type: 'controller_node',
            text: controller.name,
            name: controller.name,
            children: []
          };

          data.push(controllerNode);

          IoTAPI.getDevices(controller.controllerId).then(
            function (devices) {

              devices.forEach(function (device) {

                controllerNode.children.push({
                  type: 'device_node',
                  controllerId: controller.controllerId,
                  deviceId: device.deviceId,
                  parent: controllerNode,
                  text: device.name,
                  name: device.name
                });
              });

              callback();
            });

        }, function (err) {

          $('.IoT-panel-treeview-container').append(
            '<div class="IoT-panel-treeview"></div>'
          );

          var tree = new InspireTree({
            target: '.IoT-panel-treeview',
            data: data,
            sort: 'text'
          });

          //$('input').on('keyup', function(event) {
          //  sourceTree.search(this.value);
          //});

          tree.on('node.dblclick', function(event, node) {

            if(node.type === 'device_node'){

              _bb8Extension.connect(
                node.controllerId,
                node.deviceId,
                node.name);
            }
          });
        });
      });
    }

    /////////////////////////////////////////////////////////////
    // setVisible override (not used in that sample)
    //
    /////////////////////////////////////////////////////////////
    _thisPanel.setVisible = function(show) {

      _thisPanel.isVisible = show;

      Autodesk.Viewing.UI.DockingPanel.prototype.
        setVisible.call(this, show);

      if(show) {

        loadTree();
      }
      else {

        $('.IoT-panel-treeview').remove();
      }

      button.classList.toggle('active');
    }

    /////////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////////
    _thisPanel.toggleVisibility = function() {

      _panel.setVisible(!_thisPanel.isVisible);
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
    };
    
    /////////////////////////////////////////////////////////////
    // onTitleDoubleClick override
    //
    /////////////////////////////////////////////////////////////
    var _isMinimized = false;
    
    _thisPanel.onTitleDoubleClick = function (event) {
      
      _isMinimized = !_isMinimized;
      
      if(_isMinimized) {
        
        $(_thisPanel.container).addClass(
          'IoT-panel-minimized');
      }
      else {
        $(_thisPanel.container).removeClass(
          'IoT-panel-minimized');
      }
    };
  };
  
  /////////////////////////////////////////////////////////////
  // Set up JS inheritance
  //
  /////////////////////////////////////////////////////////////
  Panel.prototype = Object.create(
    Autodesk.Viewing.UI.DockingPanel.prototype);
  
  Panel.prototype.constructor = Panel;
  
  /////////////////////////////////////////////////////////////
  // Add needed CSS
  //
  /////////////////////////////////////////////////////////////
  var css = [
    
    'div.IoT-panel {',
      'top: 0px;',
      'left: 0px;',
      'width: 305px;',
      'height: 350px;',
      'resize: auto;',
    '}',
    
    'div.IoT-panel-minimized {',
      'height: 34px;',
      'min-height: 34px',
    '}'
  
  ].join('\n');
  
  $('<style type="text/css">' + css + '</style>').appendTo('head');
};

Autodesk.ADN.Viewing.Extension.IoT.prototype =
  Object.create(Autodesk.Viewing.Extension.prototype);

Autodesk.ADN.Viewing.Extension.IoT.prototype.constructor =
  Autodesk.ADN.Viewing.Extension.IoT;

Autodesk.Viewing.theExtensionManager.registerExtension(
  'Autodesk.ADN.Viewing.Extension.IoT',
  Autodesk.ADN.Viewing.Extension.IoT);