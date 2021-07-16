'use strict'

var Config = require('./config.js')
const axios = require('axios');

module.exports = {
    pushDeviceData,
    decodeDeviceData,
    sendRequest,
    init,
    searchAirQualityObserved,
    checkAirQualityObserved,
    createAirQualityObserved,
    updateAirQualityObserved,
    createMainSubscription,
    checkMainSubscription,
    createDeviceSubscription,
    checkDeviceSubscription
}

const Link = "<https://smartdatamodels.org/context.jsonld>; rel=\"http://www.w3.org/ns/json-ld#context\"; type=\"application/ld+json\"";

function decodeDeviceData(data) {
    return data;
}

async function createAirQualityObserved(id, refDevice) {
    var now = (new Date()).toISOString()
    var entity = {
        "id": id,
        "type": "AirQualityObserved",
        "dateObserved": {
            "type": "Property",
            "value": now
        },
        "co2": {
            "type": "Property",
            "value": 400,
            "unitCode": "PPM"
        },
        "source": {
            "type": "Property",
            "value": "chirpstack"
        },
        "typeOfLocation": {
            "type": "Property",
            "value": "indoor"
        },
        "refDevice": {
            "type": "Relationship",
            "object": refDevice
        },
        "@context": [
            "https://smartdatamodels.org/context.jsonld",
            "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
        ]
    }
    try {
        var response = await sendRequest("POST", "/entities", entity, "application/ld+json")
        return (response.status == 201)
    } catch (error) {
        return false;
    }
}

async function searchAirQualityObserved(refDevice) {
    try {
        if (Config.Debug) console.log("/entities/?type=AirQualityObserved&q=refDevice==" + encodeURI("\"" + refDevice + "\""))
        var response = await sendRequest("GET", "/entities/?type=AirQualityObserved&q=refDevice==" + encodeURI("\"" + refDevice + "\""), "", "application/ld+json", "application/ld+json", Link)
        if ((response.status === 200) && (Array.isArray(response.data))) {
            return response.data
        } else {
            if (Config.Debug) console.log("searchAirQualityObserved : response not an array "+response.status+" "+JSON.stringify(response.data, null, 4))
            return []
        }
    } catch (error) {
        if (Config.Debug) console.log("searchAirQualityObserved : "+error)
        return []
    }
}

async function pushDeviceData(refDevice, data, now) {
    var list=await searchAirQualityObserved(refDevice)
    var co2=decodeDeviceData(data)
    if (Config.Debug) console.log(JSON.stringify(list, null, 4))
    for (var i=0; i< list.length; i++) {
        await updateAirQualityObserved(list[i].id, co2, now)
    }
}

async function checkAirQualityObserved(id, refDevice) {
    try {
        var response = await sendRequest("GET", "/entities/" + id, "", "application/ld+json", "application/ld+json", Link)
        if (Config.Debug) console.log(JSON.stringify(response.data, null, 4))
        return true;
    } catch (error) {
        return false;
    }
}

async function updateAirQualityObserved(id, value, now) {
    var attributes = {
        "dateObserved": {
            "type": "Property",
            "value": now
        },
        "co2": {
            "type": "Property",
            "value": value,
            "unitCode": "PPM",
            "observedAt": now
        },
        "@context": [
            "https://smartdatamodels.org/context.jsonld",
            "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
        ]
    }
    try {
        var response = await sendRequest("PATCH", "/entities/" + id + "/attrs", attributes, "application/ld+json")
        return (response.status == 204)
    } catch (error) {
        return false;
    }
}

async function sendRequest(verb, path, body = "", contentType = "application/json", accept = "application/json", link = "") {
    var orion = Config.OrionAPI;
    var request = {
        method: verb,
        url: orion + "/ngsi-ld/v1" + path,
        headers: {
            "Accept": accept
        },
        json: true
    };
    if (link !== "") {
        request.headers["Link"] = link;
    }
    if (body !== "") {
        request.data = JSON.stringify(body);
        request.headers["Content-Type"] = contentType;
    }
    var response;
    if (Config.OrionService != "") request.headers["Fiware-Service"] = Config.OrionService;
    if (Config.OrionServicePath != "") request.headers["Fiware-ServicePath"] = Config.OrionServicePath;
    try {
        response = await axios.request(request);
    } catch (error) {
        if ((error.hasOwnProperty("response")) && (error.response.hasOwnProperty("data"))) {
            if (Config.Debug) console.log(JSON.stringify(error.response.data))
        }
        return Promise.reject(error)
    }
    return response
}

async function createMainSubscription() {
    var subscription = {
        "id": Config.MainSubscriptionId,
        "description": "Register to all AirQualityObserved object to link with refDevice change",
        "type": "Subscription",
        "entities": [{ "type": "AirQualityObserved" }],
        "watchedAttributes": ["refDevice"],
        "notification": {
            "attributes": ["refDevice"],
            "endpoint": {
                "uri": "http://" + Config.SubscriptionHost + ":" + Config.AgentListenPort + "/subscription/airqualityobserved",
                "accept": "application/json"
            }
        },
        "@context": [
            "https://smartdatamodels.org/context.jsonld",
            "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
        ]
    }
    try {
        var response = await sendRequest("POST", "/subscriptions", subscription, "application/ld+json")
        return true;
    } catch (error) {
        return false;
    }

}

async function checkMainSubscription() {
    try {
        var response = await sendRequest("GET", "/subscriptions/" + Config.MainSubscriptionId, "", "application/ld+json", "application/ld+json", Link)
        return true;
    } catch (error) {
        return false;
    }
}

async function createDeviceSubscription(deviceid) {
    var subscription = {
        "id": Config.MainSubscriptionId + ":" + deviceid,
        "description": "Track change on Device",
        "type": "Subscription",
        "entities": [{
            "id": deviceid,
            "type": "Device"
        }
        ],
        "watchedAttributes": ["value"],
        "notification": {
            "attributes": ["value", "dateLastValueReported"],
            "endpoint": {
                "uri": "http://" + Config.SubscriptionHost + ":" + Config.AgentListenPort + "/subscription/device/" + deviceid,
                "accept": "application/json"
            }
        },
        "@context": [
            "https://smartdatamodels.org/context.jsonld",
            "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
        ]
    }
    try {
        var response = await sendRequest("POST", "/subscriptions", subscription, "application/ld+json")
        return true;
    } catch (error) {
        return false;
    }

}

async function checkDeviceSubscription(deviceid) {
    try {
        var response = await sendRequest("GET", "/subscriptions/" + Config.MainSubscriptionId + ":" + deviceid, "", "application/ld+json", "application/ld+json", Link)
        return true;
    } catch (error) {
        return false;
    }
}

async function init() {
    if (! await checkMainSubscription()) await createMainSubscription();
    for (var id in Config.Devices) {
        if (! await checkAirQualityObserved(id, Config.Devices[id])) await createAirQualityObserved(id, Config.Devices[id])
        if (! await checkDeviceSubscription(Config.Devices[id])) await createDeviceSubscription(Config.Devices[id])
    }
}