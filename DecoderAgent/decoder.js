'use strict'

var Config = require('./config.js')
const axios = require('axios');

module.exports = {
    pushDeviceData,
    sendRequest,
    init,
    searchAirQualityObserved,
    checkAirQualityObserved,
    getAirQualityObserved,
    createAirQualityObserved,
    updateAirQualityObserved,
    createMainSubscription,
    checkMainSubscription,
    createDeviceSubscription,
    checkDeviceSubscription
}

const Link = "<https://smartdatamodels.org/context.jsonld>; rel=\"http://www.w3.org/ns/json-ld#context\"; type=\"application/ld+json\"";

const MASK_CO2 =            0B00000001
const MASK_TVOC =           0B00000010
const MASK_VOLTAGE =        0B00000100
const MASK_TEMPERATURE =    0B00001000
const MASK_HUMIDITY =       0B00010000
const MASK_PRESSURE =       0B00100000
const MASK_ALTITUDE =       0B01000000

/*
function decodeDeviceData(data) {
    const buff = Buffer.from(data, 'base64');
    if (buff.length===4) {
        var ppm = buff.readUInt8(0) * 256 + buff.readUInt8(1);
        var volts = buff.readUInt8(2) * 256 + buff.readUInt8(3);
        return [ppm, volts/100]
    } else {
        var indice=1;
        var response=[]
        if (buff.length>=indice) {
            if (buff.readUInt8(0) & MASK_CO2===MASK_CO2) {
                if (buff.length>=indice+2) {
                    var value=
                }
            }
        }
    }
    return [0, 0];
}*/

async function createAirQualityObserved(id, refDevice) {
    var now = (new Date()).toISOString()
    var entity = {
        "id": id,
        "type": "AirQualityObserved",
        "dateObserved": {
            "type": "Property",
            "value": now
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
            if (Config.Debug) console.log("searchAirQualityObserved : response not an array " + response.status + " " + JSON.stringify(response.data, null, 4))
            return []
        }
    } catch (error) {
        if (Config.Debug) console.log("searchAirQualityObserved : " + error)
        return []
    }
}

async function pushDeviceData(refDevice, data, now) {
    var list = await searchAirQualityObserved(refDevice)
     if (Config.Debug) console.log(JSON.stringify(list, null, 4))
    for (var i = 0; i < list.length; i++) {
        console.log(now + "\t Updating " + list[i].id + " with value " + data)
        await updateAirQualityObserved(list[i].id, data, now)
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

async function getAirQualityObserved(id) {
    try {
        var response = await sendRequest("GET", "/entities/" + id, "", "application/ld+json", "application/ld+json", Link)
        
        if (response.hasOwnProperty("data")) {
            if (Config.Debug) console.log(JSON.stringify(response.data, null, 4))
            return response.data;
        } else {
            return Promise.reject("no data in the response : status="+response.status)
        }
    } catch (error) {
        return Promise.reject(error)
    }
}

function formatAttribute(value, unit, now) {
    return {
        "type": "Property",
        "value": value,
        "unitCode": unit,
        "observedAt": now
    }
}

async function updateAirQualityObserved(id, data, now) {
    if (Config.Debug) console.log("updateAirQualityObserved with data: "+data)
    const buff = Buffer.from(data, 'base64');
    var update = {
        "dateObserved": {
            "type": "Property",
            "value": now
        },
        "@context": [
            "https://smartdatamodels.org/context.jsonld",
            "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
        ]
    }
    var create = {
        "@context": [
            "https://smartdatamodels.org/context.jsonld",
            "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
        ]
    }
    var created=false;
    try {
        var entity = await getAirQualityObserved(id);
        if (buff.length === 4) {
            if (entity.hasOwnProperty("co2")) {
                update.co2=formatAttribute(buff.readUInt8(0) * 256 + buff.readUInt8(1),"59", now)
            } else {
                create.co2=formatAttribute(buff.readUInt8(0) * 256 + buff.readUInt8(1),"59", now)
                created=true;
            }
            if (entity.hasOwnProperty("voltage")) {
                update.voltage=formatAttribute(buff.readUInt8(2) * 256 + buff.readUInt8(3),"VLT", now)
            } else {
                create.voltage=formatAttribute(buff.readUInt8(2) * 256 + buff.readUInt8(3),"VLT", now)
                created=true;
            }

        } else {
            if (Config.Debug) console.log("Type of payload "+buff.readUInt8(0) )
            var indice = 1;
            if (buff.length > indice) {
                if ((buff.readUInt8(0) & MASK_CO2) === MASK_CO2) {
                    if (Config.Debug) console.log("\tHAVE CO2")
                    if (entity.hasOwnProperty("co2")) {
                        update.co2=formatAttribute(buff.readUInt8(indice) * 256 + buff.readUInt8(indice+1),"59", now)
                    } else {
                        create.co2=formatAttribute(buff.readUInt8(indice) * 256 + buff.readUInt8(indice+1),"59", now)
                        created=true;
                    }
                    indice += 2;
                }
                if ((buff.readUInt8(0) & MASK_TVOC) === MASK_TVOC) {
                    if (Config.Debug) console.log("\tHAVE TVOC")
                    if (entity.hasOwnProperty("volatileOrganicCompoundsTotal")) {
                        update.volatileOrganicCompoundsTotal=formatAttribute(buff.readUInt8(indice) * 256 + buff.readUInt8(indice+1),"61", now)
                    } else {
                        create.volatileOrganicCompoundsTotal=formatAttribute(buff.readUInt8(indice) * 256 + buff.readUInt8(indice+1),"61", now)
                        created=true;
                    }
                    indice += 2;
                }
                if ((buff.readUInt8(0) & MASK_VOLTAGE) === MASK_VOLTAGE) {
                    if (Config.Debug) console.log("\tHAVE VOLTAGE")
                    if (entity.hasOwnProperty("voltage")) {
                        update.voltage=formatAttribute((buff.readUInt8(indice) * 256 + buff.readUInt8(indice+1))/1000,"VLT", now)
                    } else {
                        create.voltage=formatAttribute((buff.readUInt8(indice) * 256 + buff.readUInt8(indice+1))/1000,"VLT", now)
                        created=true;
                    }
                    indice += 2;
                }
                if ((buff.readUInt8(0) & MASK_TEMPERATURE)  === MASK_TEMPERATURE ) {
                    if (Config.Debug) console.log("\tHAVE TEMPERATURE")
                    if (entity.hasOwnProperty("temperature")) {
                        update.temperature=formatAttribute(buff.readUInt8(indice) * 256 + buff.readUInt8(indice+1),"CEL", now)
                    } else {
                        create.temperature=formatAttribute(buff.readUInt8(indice) * 256 + buff.readUInt8(indice+1),"CEL", now)
                        created=true;
                    }
                    indice += 2;
                }
                if ((buff.readUInt8(0) & MASK_HUMIDITY)  === MASK_HUMIDITY ) {
                    if (Config.Debug) console.log("\tHAVE HUMIDITY")
                    if (entity.hasOwnProperty("relativeHumidity")) {
                        update.relativeHumidity=formatAttribute(buff.readUInt8(indice) * 256 + buff.readUInt8(indice+1),"P1", now)
                    } else {
                        create.relativeHumidity=formatAttribute(buff.readUInt8(indice) * 256 + buff.readUInt8(indice+1),"P1", now)
                        created=true;
                    }
                    indice += 2;
                }
                if ((buff.readUInt8(0) & MASK_PRESSURE)  === MASK_PRESSURE ) {
                    if (Config.Debug) console.log("\tHAVE PRESSURE")
                    if (entity.hasOwnProperty("pressure")) {
                        update.pressure=formatAttribute(buff.readUInt8(indice) * 256 + buff.readUInt8(indice+1),"A97", now)
                    } else {
                        create.pressure=formatAttribute(buff.readUInt8(indice) * 256 + buff.readUInt8(indice+1),"A97", now)
                        created=true;
                    }
                    indice += 2;
                }
                if ((buff.readUInt8(0) & MASK_ALTITUDE)  === MASK_ALTITUDE ) {
                    if (Config.Debug) console.log("\tHAVE ALTITUDE")
                    var elevation=buff.readUInt8(indice) * 256 + buff.readUInt8(indice+1);
                    if (elevation>(65536/2)) elevation=elevation-65536;
                    if (entity.hasOwnProperty("elevation")) {
                        update.elevation=formatAttribute(buff.readUInt8(indice) * 256 + buff.readUInt8(indice+1),"MTR", now)
                    } else {
                        create.elevation=formatAttribute(buff.readUInt8(indice) * 256 + buff.readUInt8(indice+1),"MTR", now)
                        created=true;
                    }
                    indice += 2;
                }
            }
        }
        if (created) {
            try {
                var response = await sendRequest("POST", "/entities/" + id + "/attrs", create, "application/ld+json")
            } catch (error) {
                console.log(JSON.stringify(error))
            }  
        }
        try {
            var response = await sendRequest("PATCH", "/entities/" + id + "/attrs", update, "application/ld+json")
            return (response.status == 204)
        } catch (error) {
            return Promise.reject(error)
        }
    } catch (error) {
        return Promise.reject(error)
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