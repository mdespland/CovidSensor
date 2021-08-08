'use strict';

const Config = require('./config');
const axios = require('axios');
const MQTT = require("async-mqtt");
const { entityExists } = require('./orion-ld');

module.exports = {
    createMainSubscription,
    checkMainSubscription,
    init,
    updateDevice,
    checkProperty,
    checkRelation,
    checkType
}
const MASK_BASELINE     = 0B00000001
const MASK_THRESHOLD    = 0B00000010

var devices={}
const Link = "<https://smartdatamodels.org/context.jsonld>; rel=\"http://www.w3.org/ns/json-ld#context\"; type=\"application/ld+json\"";

function checkProperty(entity, property, context) {
    var value="";
    if (entity.hasOwnProperty(property)) {
        if (entity[property].hasOwnProperty("value")) {
            value=entity[property].value;
        } else {
            throw new Error("Property "+property+ " has no value")
        }
    } else {
        if (entity.hasOwnProperty(context+property)) {
            if (entity[context+property].hasOwnProperty("value")) {
                value=entity[context+property].value;
            } else {
                throw new Error("Property "+context+property+ " has no value")
            }
        } else {
            throw new Error("Property "+context+property+ " not found")
        }
    }
    return value;
}


function checkRelation(entity, relation, context) {
    var value="";
    if (entity.hasOwnProperty(relation)) {
        if (entity[relation].hasOwnProperty("object")) {
            value=entity[relation].object;
        } else {
            throw new Error("Relation "+relation+ " has no object")
        }
    } else {
        if (entity.hasOwnProperty(context+relation)) {
            if (entity[context+relation].hasOwnProperty("object")) {
                value=entity[context+relation].object;
            } else {
                throw new Error("Relation "+context+relation+ " has no object")
            }
        } else {
            throw new Error("Relation "+context+relation+ " not found")
        }
    }
    return value;
}

function checkType(entity, type, context) {
    var value=false;
    if (entity.hasOwnProperty("type")) {
        if (entity.type===type) {
            value=true;
        } else {
            if (entity.type===context+type) {
                value=true
            } else {
                value=false
            }
        }
    } else {
        throw new Error("Entity has no type")
    }
    return value;
}

async function updateDevice(id, co2, initLevel) {
    if (devices.hasOwnProperty(id)) {

        var buff=Buffer.allocUnsafe(5);
        buff.writeUInt8(0, 0);
        var indice=1;
        if (devices[id].initLevel!==initLevel) {
            buff.writeUInt8(buff.readUInt8(0) | MASK_BASELINE, 0);
            buff.writeUInt8(Math.floor(initLevel/256),indice)
            buff.writeUInt8(initLevel % 256,indice+1)
            indice+=2;
            devices[id].initLevel=initLevel;
        }
        if (devices[id].co2!==co2) {
            buff.writeUInt8(buff.readUInt8(0) | MASK_THRESHOLD, 0);
            buff.writeUInt8(Math.floor(co2/256),indice)
            buff.writeUInt8(co2 % 256,indice+1)
            indice+=2;
            devices[id].co2=co2;
        }

        if (indice>1) {
            var payload={
                "confirmed": true, 
                "fPort": 5,
                "data": buff.toString("base64", 0, indice)
            }
            var deveui=id.substring(Config.BaseDeviceUrn.length);
            try {
                console.log("Push payload for device "+ id)
                var client= await MQTT.connectAsync(Config.MqttURL)
                await client.publish("application/"+Config.ApplicationId+"/device/"+deveui+"/command/down", JSON.stringify(payload))
                await client.end();
            } catch (error) {
                console.log(error)
            }
        }

    } else {
        console.log("this is a new Device " +id);
        devices[id]={
            co2: co2,
            initLevel: initLevel
        }
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
    try {
        response = await axios.request(request);
    } catch (error) {
        console.log(error)
        if (error.hasOwnProperty("response") && error.response && error.response.hasOwnProperty("data")) {
            if (Config.Debug) console.log(JSON.stringify(error.response.data))
        }
        return Promise.reject(error)
    }
    return response
}

async function createMainSubscription() {
    var subscription = {
        "id": Config.MainSubscriptionId,
        "description": "Register to all Device object to link with refDevice change",
        "type": "Subscription",
        "entities": [{ "type": "Device" }],
        "watchedAttributes": ["co2", "initLevel"],
        "notification": {
            "attributes": ["co2", "initLevel", "refDeviceModel"],
            "endpoint": {
                "uri": "http://" + Config.SubscriptionHost + ":" + Config.AgentListenPort + "/subscription/devices",
                "accept": "application/ld+json"
            }
        },
        "@context": [
            "https://smartdatamodels.org/context.jsonld",
            "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
        ]
    }
    try {
        var response = await sendRequest("POST", "/subscriptions", subscription, "application/ld+json")
        console.log("response : "+response.status)
        return true;
    } catch (error) {
        console.log(error)
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

async function init() {
    if (! await checkMainSubscription()) {
        if (await createMainSubscription()) {
            console.log("Main Subscription created : "+ Config.MainSubscriptionId)
        } else {
            console.log("Failed to create subscription : "+ Config.MainSubscriptionId)
        }
    } else {
        console.log("Main Subscription exist : "+ Config.MainSubscriptionId)
    }
    try {
        var response = await sendRequest("GET", "/entities?type=Device", "", "application/ld+json", "application/ld+json", Link)
        if (response.hasOwnProperty("data") && Array.isArray(response.data)) {
            for (var i=0; i<response.data.length; i++) {
                if (response.data[i].hasOwnProperty("id") && response.data[i].hasOwnProperty("refDeviceModel")  &&  response.data[i].refDeviceModel.object===Config.RefDeviceModel && response.data[i].hasOwnProperty("co2") && response.data[i].co2.hasOwnProperty("value") && response.data[i].hasOwnProperty("initLevel") && response.data[i].initLevel.hasOwnProperty("value")) {
                    devices[response.data[i].id]={
                        co2: response.data[i].co2.value,
                        initLevel: response.data[i].initLevel.value
                    }
                }
            }
            console.log(JSON.stringify(devices, null, 4))
        } else {
            console.log("Response not an array")
        }
    } catch (error) {
        console.log("Failed to retrieve device list")
    }
}