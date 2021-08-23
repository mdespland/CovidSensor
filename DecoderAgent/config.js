'use strict'
const fs = require('fs');
function decodeDevices() {
    var list = {
        "urn:ngsi-ld:AirQualityObserved:Co2:sensor1": "urn:ngsi-ld:Device:chirpstack:2232330000888802"
    }
    if (process.env.DEVICE_LIST) {
        try {
            list = JSON.parse(process.env.DEVICE_LIST)
        } catch (error) {
            console.log("Can't parse List : " + error)
            console.log(process.env.DEVICE_LIST)
        }
    }
    console.log(JSON.stringify(list, null, 4))
    return list;
}


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
    OrionService: process.env.ORION_SERVICE || "",
    OrionServicePath: process.env.ORION_SERVICE_PATH || "",
    AgentListenPort: process.env.AGENT_LISTEN_PORT || 8080,
    AgentListenIP: process.env.AGENT_LISTEN_IP || "0.0.0.0",
    ShowData: process.env.AGENT_SHOW_DATA ? (process.env.AGENT_SHOW_DATA == "true") : false,
    Debug: process.env.AGENT_DEBUG ? (process.env.AGENT_DEBUG == "true") : false,
    Devices: decodeDevices(),
    MainSubscriptionId: "urn:ngsi-ld:Subscription:CovidSensor:AirQualityObserved",
    SubscriptionHost: process.env.SUBSCRIPTION_HOST || "decoderagent",
    MqttURL: process.env.MQTT_URL || "mqtt://mosquitto:1883",
    ApplicationId: 2,
    BaseDeviceUrn: "urn:ngsi-ld:Device:chirpstack:",
    AgentToken: readSecret("AGENT_TOKEN", "agent_changeit_decoder")
}
