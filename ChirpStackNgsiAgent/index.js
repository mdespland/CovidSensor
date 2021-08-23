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
var Chirpstack = require('./chirpstack.js')
const axios = require('axios');
const express = require('express');
const app = express();

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


app.all('/chirpstack', async function (req, res, next) {
  //console.log(req.body.toString('binary'))
  var notif = {}
  try {
    notif = JSON.parse(req.body)
  } catch (error) {
    console.log("can't parse body " + req.body)
  }
  if (notif === {}) {
    res.sendStatus(500)
  } else {
    console.log("Notification /chirpstack => "+JSON.stringify(notif))
    try {
      if (notif.hasOwnProperty("data") && notif.hasOwnProperty("devEUI") && notif.hasOwnProperty("publishedAt") && notif.hasOwnProperty("devAddr")) {
        await Chirpstack.receiveDeviceNotification(notif);
      } else {
        console.log("Not a data event")
      }
      res.sendStatus(204)
    } catch (error) {
      console.log(error)
      res.sendStatus(500)
    }
  }
});

app.all('*', function (req, res, next) {
  var response = {
      method: req.method,
      hostname: req.hostname,
      url: req.url,
      headers: req.headers,
      body: req.body.toString('binary')
  }
  res.json({ok: true});
  console.log(JSON.stringify(response, null, 4))
});

app.listen(Config.AgentListenPort, Config.AgentListenIP);