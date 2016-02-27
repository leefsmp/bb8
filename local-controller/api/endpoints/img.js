var express = require('express');
var path = require('path');
var fs = require('fs');

module.exports = function(svcManager) {

  var router = express.Router();

  ///////////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////////
  router.get('/', (req, res)=> {

    try {

      res.send('image');
    }
    catch (error) {

      res.status(error.statusCode || 404);
      res.json(error);
    }
  });

  ///////////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////////
  router.post('/', async(req, res)=> {

    try {


      res.send('ok');
    }
    catch (error) {

      res.status(error.statusCode || 404);
      res.json(error);
    }
  });

  return router;
}
