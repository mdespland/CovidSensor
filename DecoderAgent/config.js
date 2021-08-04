'use strict'

function decodeDevices() {
    var list = {
        "urn:ngsi-ld:AirQualityObserved:Co2:sensor1": "urn:ngsi-ld:Device:chirpstack:2232330000888802"
    }
    if (process.env.DEVICE_LIST) {
        try {
            list = JSON.parse(process.env.DEVICE_LIST)
        } catch (error) {
            console.log("Can't parse List : "+ error)
            console.log(process.env.DEVICE_LIST)
        }
    }
    console.log(JSON.stringify(list,null,4))
    return list;
}

module.exports = {
    OrionAPI: process.env.ORION_API || "http://proxyld:8080",
    OrionService: process.env.ORION_SERVICE || "",
    OrionServicePath: process.env.ORION_SERVICE_PATH || "",
    AgentListenPort: process.env.AGENT_LISTEN_PORT || 8080,
    AgentListenIP: process.env.AGENT_LISTEN_IP || "0.0.0.0",
    ShowData: false,
    Debug: false,
    Devices: decodeDevices(),
    MainSubscriptionId: "urn:ngsi-ld:Subscription:CovidSensor:AirQualityObserved",
    SubscriptionHost: process.env.SUBSCRIPTION_HOST || "decoderagent",
    MqttURL: process.env.MQTT_URL || "mqtt://mosquitto:1883",
    ApplicationId: 2,
    BaseDeviceUrn: "urn:ngsi-ld:Device:chirpstack:"
}
