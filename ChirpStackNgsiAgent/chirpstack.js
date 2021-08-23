'use strict';

const Config = require('./config');
const axios = require('axios');
var OrionLD = require('./orion-ld.js')

module.exports = {
    receiveDeviceNotification,
    decodeBase64,
    ISODate,
    encodeEntity,
    toUpdateEntity
}



/*
{
    "applicationID": "1",
    "applicationName": "CovidCo2",
    "deviceName": "CovidSensor",
    "devEUI": "IjIzAACIiAI=",
    "rxInfo": [],
    "txInfo": {
        "frequency": 867100000,
        "modulation": "LORA",
        "loRaModulationInfo": {
            "bandwidth": 125,
            "spreadingFactor": 12,
            "codeRate": "4/5",
            "polarizationInversion": false
        }
    },
    "adr": true,
    "dr": 0,
    "fCnt": 160,
    "fPort": 2,
    "data": "AAECAw==",
    "objectJSON": "",
    "tags": {},
    "confirmedUplink": true,
    "devAddr": "AY4xYg==",
    "publishedAt": "2021-07-11T15:14:40.642748053Z"
}*/

function decodeBase64(data) {
    const buff = Buffer.from(data, 'base64');
    return buff.toString('hex');
}

function ISODate(date) {
    try {
        var local=new Date(date)
        return local.toISOString()
    } catch (error) {
        return ""
    }
}

async function receiveDeviceNotification(notification) {
    var entity = encodeEntity(notification);
    try {
        if (! await OrionLD.entityExists(entity.id)) {
            console.log("Create entity "+ entity.id+" with value "+entity.value.value)
            await OrionLD.createEntity(entity)
        } else {
            console.log("Update entity "+ entity.id+" with value "+entity.value.value)
            await OrionLD.updateEntity(entity.id, toUpdateEntity(entity))
        }
    } catch (error) {
        return Promise.reject("Can't create entity: " + error)
    }
    return true;
}

//maxLevel,initLevel
function encodeEntity(notification) {
    var device = {
        "id": "urn:ngsi-ld:Device:chirpstack:" + decodeBase64(notification.devEUI),
        "type": "Device",
        "category": {
            "type": "Property",
            "value": [
                "sensor"
            ]
        },
        "dateFirstUsed": {
            "type": "Property",
            "value": {
                "@type": "DateTime",
                "@value": ISODate(notification.publishedAt)
            }
        },
        "dateLastValueReported": {
            "type": "Property",
            "value": {
                "@type": "DateTime",
                "@value": ISODate(notification.publishedAt)
            }
        }, "serialNumber": {
            "type": "Property",
            "value": decodeBase64(notification.devAddr)
        },
        "value": {
            "type": "Property",
            "value": notification.data
        },
        "refDeviceModel": {
            "type": "Relationship",
            "object": "urn:ngsi-ld:DeviceModel:chirpstack:covidco2"
        },
        "controlledProperty": {
            "type": "Property",
            "value": [
                "airPollution"
            ]
        },
        "supportedProtocol": {
            "type": "Property",
            "value": [
                "lora"
            ]
        },
        "deviceState": {
            "type": "Property",
            "value": "ok"
        },
        "co2": {
            "type": "Property",
            "value": 0
        },
        "initLevel": {
            "type": "Property",
            "value": 0
        },
        "@context": [
            "https://smartdatamodels.org/context.jsonld"
        ]
    }
    //console.log(JSON.stringify(device))
    return device;
}

function toUpdateEntity(entity) {
    var update = {
        "@context": [
            "https://smartdatamodels.org/context.jsonld"
        ],
        "value": {
            "type": "Property",
            "value": entity.value.value,
            "observedAt": entity.dateFirstUsed.value["@value"],
        },
        "dateLastValueReported": entity.dateLastValueReported
    }
    //console.log(JSON.stringify(update))
    return update;
}