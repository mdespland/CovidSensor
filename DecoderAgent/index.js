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
var Decoder = require('./decoder.js')
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


app.all('/subscription/airqualityobserved', async function (req, res, next) {
    if (Config.Debug) console.log(req.body.toString('binary'))
    var notification = {}
    try {
        notification = JSON.parse(req.body)
    } catch (error) {
        console.log("can't parse body " + req.body)
    }
    if (notification === {}) {
        res.sendStatus(500)
    } else {
        console.log("Notification /subscription/airqualityobserved => "+JSON.stringify(notification))
        if ((notification.hasOwnProperty("subscriptionId")) && (notification.subscriptionId === Config.MainSubscriptionId)) {
            if ((notification.hasOwnProperty("data")) && Array.isArray(notification.data)) {
                for (var i = 0; i < notification.data.length; i++) {
                    if (notification.data[i].hasOwnProperty("id") && notification.data[i].hasOwnProperty("refDevice") && notification.data[i].refDevice.hasOwnProperty("object")) {
                        try {
                            if (! await Decoder.checkDeviceSubscription(notification.data[i].refDevice.object)) await Decoder.createDeviceSubscription(notification.data[i].refDevice.object)
                        } catch (error) { }
                    }

                }
            }
        }
        res.sendStatus(204)
    }
});

app.all('/subscription/device/:deviceid', async function (req, res, next) {
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
        console.log("Notification /subscription/device/"+req.params.deviceid+" => "+JSON.stringify(notification))
        if (notification.hasOwnProperty("subscriptionId")) {
            if ((notification.hasOwnProperty("data")) && Array.isArray(notification.data)) {
                for (var i = 0; i < notification.data.length; i++) {
                    if (Config.Debug) {
                        console.log("notification.data[i].hasOwnProperty(id) :" +notification.data[i].hasOwnProperty("id"))
                        console.log("notification.data[i].hasOwnProperty(\"https://smart-data-models.github.io/data-models/terms.jsonld#/definitions/dateLastValueReported\") : "+notification.data[i].hasOwnProperty("https://smart-data-models.github.io/data-models/terms.jsonld#/definitions/dateLastValueReported"))
                        console.log("notification.data[i].hasOwnProperty(\"value\") && notification.data[i].value.hasOwnProperty(\"value\") : "+(notification.data[i].hasOwnProperty("value") && notification.data[i].value.hasOwnProperty("value")))
                        console.log("notification.data[i][\"https://smart-data-models.github.io/data-models/terms.jsonld#/definitions/dateLastValueReported\"].hasOwnProperty(\"value\") : "+notification.data[i]["https://smart-data-models.github.io/data-models/terms.jsonld#/definitions/dateLastValueReported"].hasOwnProperty("value"))
                        console.log("notification.data[i][\"https://smart-data-models.github.io/data-models/terms.jsonld#/definitions/dateLastValueReported\"].value.hasOwnProperty(\"@value\") : "+notification.data[i]["https://smart-data-models.github.io/data-models/terms.jsonld#/definitions/dateLastValueReported"].value.hasOwnProperty("@value"))
                    }
                    if (notification.data[i].hasOwnProperty("id")
                        && notification.data[i].hasOwnProperty("value") && notification.data[i].value.hasOwnProperty("value")
                        && notification.data[i].hasOwnProperty("https://smart-data-models.github.io/data-models/terms.jsonld#/definitions/dateLastValueReported")
                        && notification.data[i]["https://smart-data-models.github.io/data-models/terms.jsonld#/definitions/dateLastValueReported"].hasOwnProperty("value")
                        && notification.data[i]["https://smart-data-models.github.io/data-models/terms.jsonld#/definitions/dateLastValueReported"].value.hasOwnProperty("@value")) {
                        if (req.params.deviceid === notification.data[i].id) {
                            try {
                                if (Config.Debug) console.log("pushDeviceData("+notification.data[i].id+", "+notification.data[i].value.value+", "+notification.data[i]["https://smart-data-models.github.io/data-models/terms.jsonld#/definitions/dateLastValueReported"].value["@value"]+")")
                                await Decoder.pushDeviceData(notification.data[i].id, notification.data[i].value.value, notification.data[i]["https://smart-data-models.github.io/data-models/terms.jsonld#/definitions/dateLastValueReported"].value["@value"])
                            } catch (error) { }
                        } else {
                            if (Config.Debug) console.log("Wrong device notification "+req.params.deviceid+" : "+ notification.data[i].id)
                        }
                    } else {
                        if (Config.Debug) console.log("Wrong format") 
                    }

                }

            }
        }
        res.sendStatus(204)
    }

});

app.all('*', function (req, res, next) {
    response = {
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
    await Decoder.init();
    console.log("Server initialized");
})

