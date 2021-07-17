//
// Copyright 2018-2020 Orange
//
// See the NOTICE file distributed with this work for additional information
// regarding copyright ownership.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//


'use strict';


var Config = require('./config');
const axios = require('axios');
const express = require('express');
var cors = require('cors')
const app = express();
app.use(cors())

app.use(function (req, res, next) {
  var data = [];
  req.on('data', function (chunk) {
    data.push(chunk);
  });
  req.on('end', function () {
    req.body = Buffer.concat(data);
    next();
  });
});


app.all('*', async function (req, res, next) {
  if (req.url.startsWith(Config.BasePath)) {
    var base = req.url.substring(Config.BasePath.length);
    req.url = base;
    var host=Config.OrionAPIURL;

    if (base.startsWith("/temporal/entities")) {
      if (req.method==="GET") {
        host=Config.MintakaAPIURL;
      }
    }
    
    var request = {
      method: req.method,
      url: host + req.url,
      headers: req.headers,
      data: req.body
    };
    console.log("Request : "+ req.url+ " - "+ request.url)
    delete request.headers.host;
    delete request.headers["content-length"];
    try {
      var response;
      response = await axios.request(request);
      res.statusCode = response.status
      res.headers = response.headers;
      res.send(response.data);
    } catch (error) {
      if ((error.hasOwnProperty("response")) && (error.response !== undefined)) {
        res.statusCode = error.response.status
        res.headers = error.response.headers;
        res.send(error.response.data);
      } else {
        console.log(error);
      }
    }
  } else {
    res.sendStatus(404)
  }
});


app.listen(Config.ProxyListenPort,Config.ProxyListenIP);