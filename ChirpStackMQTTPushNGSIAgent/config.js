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

'use strict'

function readSecret(key, value) {
    var result = "";
    if (process.env.hasOwnProperty(key + "_FILE")) {
        try {
            result = fs.readFileSync(process.env[key + "_FILE"], "utf8").trim();
        } catch (error) {
            console.log("Can't read secret file for " + key + " : " + process.env[key + "_FILE"]);
            result = value;
        }
    } else {
        if (process.env.hasOwnProperty(key)) {
            result = process.env[key];
        } else {
            result = value;
        }
    }
    return result;
}

module.exports = {
    OrionAPI: process.env.ORION_API_URL || "http://proxyld:8080",
    MqttURL: process.env.MQTT_URL || "mqtt://mosquitto:1883",
    AgentListenPort: 8080,
    AgentListenIP: "0.0.0.0",
    SubscriptionHost: process.env.SUBSCRIPTION_HOST || "chirpstackdown",
    ShowData: false,
    Debug: false,
    MainSubscriptionId: "urn:ngsi-ld:Subscription:CovidSensor:Device:Downlink",
    RefDeviceModel: "urn:ngsi-ld:DeviceModel:chirpstack:covidco2",
    ApplicationId: 2,
    BaseDeviceUrn: "urn:ngsi-ld:Device:chirpstack:",
    AgentToken: readSecret("AGENT_TOKEN", "agent_changeit_mqtt")
}