const assert = require('assert');
var Config = require('../config.js')
var Chirpstack = require('../chirpstack.js')
var OrionLD = require('../orion-ld.js')
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

describe('Test Chirpstack', function () {
    this.timeout(5000);

    before(async () => {
    })
    after(async () => {
        try {
            await OrionLD.deleteEntity("urn:ngsi-ld:Device:chirpstack:000000")
        }catch(error) {

        }
    })
    it('Test Base64 decode', async () => {
        expect(Chirpstack.decodeBase64("AAAA")).to.be.eql("000000")
    })
    it('Test ISODate', async () => {
        expect(Chirpstack.ISODate("2021-07-11T15:14:40.642748053Z")).to.be.eql("2021-07-11T15:14:40.642Z")
    })
    it('Test encodeDevice', async () => {
        expect(Chirpstack.encodeEntity({
            "applicationID": "1",
            "applicationName": "CovidCo2",
            "deviceName": "CovidSensor",
            "devEUI": "AAAA",
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
        })).to.be.eql({ "id": "urn:ngsi-ld:Device:chirpstack:000000", "type": "Device", "category": { "type": "Property", "value": ["sensor"] }, "dateFirstUsed": { "type": "Property", "value": { "@type": "DateTime", "@value": "2021-07-11T15:14:40.642Z" } }, "dateLastValurReported": { "type": "Property", "value": { "@type": "DateTime", "@value": "2021-07-11T15:14:40.642Z" } }, "serialNumber": { "type": "Property", "value": "018e3162" }, "value": { "type": "Property", "value": "AAECAw==" }, "refDeviceModel": { "type": "Relationship", "object": "urn:ngsi-ld:DeviceModel:chirpstack:covidco2" }, "controlledProperty": { "type": "Property", "value": ["airPollution"] }, "supportedProtocol": { "type": "Property", "value": ["lora"] }, "deviceState": { "type": "Property", "value": "ok" }, "@context": ["https://smartdatamodels.org/context.jsonld"] })
    })
    it('Test toUpdateEntity', async () => {
        expect(Chirpstack.toUpdateEntity({ "id": "urn:ngsi-ld:Device:chirpstack:000000", "type": "Device", "category": { "type": "Property", "value": ["sensor"] }, "dateFirstUsed": { "type": "Property", "value": { "@type": "DateTime", "@value": "2021-07-11T15:14:40.642Z" } }, "dateLastValurReported": { "type": "Property", "value": { "@type": "DateTime", "@value": "2021-07-11T15:14:40.642Z" } }, "serialNumber": { "type": "Property", "value": "018e3162" }, "value": { "type": "Property", "value": "AAECAw==" }, "refDeviceModel": { "type": "Relationship", "object": "urn:ngsi-ld:DeviceModel:chirpstack:covidco2" }, "controlledProperty": { "type": "Property", "value": ["airPollution"] }, "supportedProtocol": { "type": "Property", "value": ["lora"] }, "deviceState": { "type": "Property", "value": "ok" }, "@context": ["https://smartdatamodels.org/context.jsonld"] })).to.be.eql({"@context":["https://smartdatamodels.org/context.jsonld"],"value":{"type":"Property","value":"AAECAw==","observedAt":"2021-07-11T15:14:40.642Z"},"dateLastValurReported":{"type":"Property","value":{"@type":"DateTime","@value":"2021-07-11T15:14:40.642Z"}}})
    })
    it('Test receiveDeviceNotification', async () => {
        await expect(Chirpstack.receiveDeviceNotification({
            "applicationID": "1",
            "applicationName": "CovidCo2",
            "deviceName": "CovidSensor",
            "devEUI": "AAAA",
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
        })).to.be.fulfilled
        var response = await expect(OrionLD.getEntity("urn:ngsi-ld:Device:chirpstack:000000")).to.be.fulfilled;
        expect(response).to.be.eql({"@context":"https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld","id":"urn:ngsi-ld:Device:chirpstack:000000","type":"https://uri.fiware.org/ns/data-models#Device","https://smart-data-models.github.io/data-models/terms.jsonld#/definitions/category":{"type":"Property","value":"sensor"},"https://smart-data-models.github.io/data-models/terms.jsonld#/definitions/dateFirstUsed":{"type":"Property","value":{"@type":"DateTime","@value":"2021-07-11T15:14:40.642Z"}},"dateLastValurReported":{"type":"Property","value":{"@type":"DateTime","@value":"2021-07-11T15:14:40.642Z"}},"https://smart-data-models.github.io/data-models/terms.jsonld#/definitions/serialNumber":{"type":"Property","value":"018e3162"},"value":{"type":"Property","value":"AAECAw=="},"https://smart-data-models.github.io/data-models/terms.jsonld#/definitions/refDeviceModel":{"type":"Relationship","object":"urn:ngsi-ld:DeviceModel:chirpstack:covidco2"},"https://smart-data-models.github.io/data-models/terms.jsonld#/definitions/controlledProperty":{"type":"Property","value":"airPollution"},"https://smart-data-models.github.io/data-models/terms.jsonld#/definitions/supportedProtocol":{"type":"Property","value":"lora"},"https://smart-data-models.github.io/data-models/terms.jsonld#/definitions/deviceState":{"type":"Property","value":"ok"}})
    })
    it('Test receiveDeviceNotification same Device', async () => {
        await expect(Chirpstack.receiveDeviceNotification({
            "applicationID": "1",
            "applicationName": "CovidCo2",
            "deviceName": "CovidSensor",
            "devEUI": "AAAA",
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
            "data": "BBECAw==",
            "objectJSON": "",
            "tags": {},
            "confirmedUplink": true,
            "devAddr": "AY4xYg==",
            "publishedAt": "2021-07-12T15:14:40.642748053Z"
        })).to.be.fulfilled
        var response = await expect(OrionLD.getEntity("urn:ngsi-ld:Device:chirpstack:000000")).to.be.fulfilled;
        expect(response).to.be.eql({"@context":"https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld","id":"urn:ngsi-ld:Device:chirpstack:000000","type":"https://uri.fiware.org/ns/data-models#Device","https://smart-data-models.github.io/data-models/terms.jsonld#/definitions/category":{"type":"Property","value":"sensor"},"https://smart-data-models.github.io/data-models/terms.jsonld#/definitions/dateFirstUsed":{"type":"Property","value":{"@type":"DateTime","@value":"2021-07-11T15:14:40.642Z"}},"https://smart-data-models.github.io/data-models/terms.jsonld#/definitions/serialNumber":{"type":"Property","value":"018e3162"},"https://smart-data-models.github.io/data-models/terms.jsonld#/definitions/refDeviceModel":{"type":"Relationship","object":"urn:ngsi-ld:DeviceModel:chirpstack:covidco2"},"https://smart-data-models.github.io/data-models/terms.jsonld#/definitions/controlledProperty":{"type":"Property","value":"airPollution"},"https://smart-data-models.github.io/data-models/terms.jsonld#/definitions/supportedProtocol":{"type":"Property","value":"lora"},"https://smart-data-models.github.io/data-models/terms.jsonld#/definitions/deviceState":{"type":"Property","value":"ok"},"value":{"type":"Property","value":"BBECAw==","observedAt":"2021-07-12T15:14:40.642Z"},"dateLastValurReported":{"type":"Property","value":{"@type":"DateTime","@value":"2021-07-12T15:14:40.642Z"}}})
    })
})
