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


app.all('/subscription/devices', async function (req, res, next) {
  if (Config.Debug) console.log(req.body.toString('binary'))
  var notification = {}
  try {
    notification = JSON.parse(req.body)
  } catch (error) {
    console.log("can't parse body " + req.body)
  }
  if (notification === {}) {
    console.log("notification empty")
    res.sendStatus(500)
  } else {
    console.log("Notification /subscription/devices " + JSON.stringify(notification))

    if (notification.hasOwnProperty("subscriptionId")) {
      if ((notification.hasOwnProperty("data")) && Array.isArray(notification.data)) {
        for (var i = 0; i < notification.data.length; i++) {
          if (notification.data[i].hasOwnProperty("id")) {
            try {
              var co2 = Chirpstack.checkProperty(notification.data[i], "co2", "https://smart-data-models.github.io/data-models/terms.jsonld#/definitions/")
              var initLevel = Chirpstack.checkProperty(notification.data[i], "initLevel", "https://smart-data-models.github.io/data-models/terms.jsonld#/definitions/")
              var refDeviceModel = Chirpstack.checkRelation(notification.data[i], "refDeviceModel", "https://smart-data-models.github.io/data-models/terms.jsonld#/definitions/")
              if (refDeviceModel === Config.RefDeviceModel) {
                await Chirpstack.updateDevice(notification.data[i].id, co2, initLevel)
              } else {
                console.log("Wrong refDeviceModel : " + refDeviceModel+"<>"+Config.RefDeviceModel)
              }
            } catch (error) {
              console.log("Wrong format : " + error)
            }
          } else {
            console.log("Wrong format")
          }
        }
      }
    }


    res.sendStatus(204)
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
  res.json({ ok: true });
  console.log(JSON.stringify(response, null, 4))
});

app.listen(Config.AgentListenPort, Config.AgentListenIP, async function (err) {
  if (err) console.log("Error in server setup")
  console.log("Server listening on Port", Config.AgentListenPort);
  await Chirpstack.init();
  console.log("Server initialized");
})