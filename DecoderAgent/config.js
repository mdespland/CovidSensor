'use strict'

function decodeDevices() {
    var list = {
        "urn:ngsi-ld:AirQualityObserved:Co2:sensor1": "urn:ngsi-ld:Device:chirpstack:2232330000888802"
    }
    if (process.env.DEVICE_LIST) {
        try {
            list = JSON.parse(process.env.DEVICE_LIST)
        } catch (error) {

        }
    }
    return list;
}

module.exports = {
    OrionAPI: process.env.ORION_API || "http://proxyld:8080",
    OrionService: process.env.ORION_SERVICE || "",
    OrionServicePath: process.env.ORION_SERVICE_PATH || "",
    AgentListenPort: process.env.AGENT_LISTEN_PORT || 8080,
    AgentListenIP: process.env.AGENT_LISTEN_IP || "0.0.0.0",
    ShowData: true,
    Debug: true,
    Devices: decodeDevices(),
    MainSubscriptionId: "urn:ngsi-ld:Subscription:CovidSensor:AirQualityObserved",
    SubscriptionHost: process.env.SUBSCRIPTION_HOST || "decoderagent",
}
