const assert = require('assert');
var Tools = require('./common.js')
var Config = require('../config.js')
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
var Subscribe = require('./subscribe.js')

var entities = [];
var csources = [];
var subscriptions = [];
var sourceSubscriptions = [];
var lastentity = {};
function test(param = {
    type: "test",
    value: 42
}) {
    return param;
}
var port = 8284;

describe('Test Subscriptions Entities worklow to work with ORION-LD + MINTAKA', function () {
    this.timeout(10000);
    before(async () => {
        Subscribe.listen(port)
    })
    after(async () => {
        Subscribe.close()
        for (var i = 0; i < entities.length; i++) {
            try {
                await Tools.sendRequest("DELETE", "/entities/" + entities[i]);
                await Tools.sendRequest("DELETE", "/temporal/entities/" + entities[i]);
            } catch (error) { }
        }
        for (var i = 0; i < subscriptions.length; i++) {
            try {
                await Tools.sendRequest("DELETE", "/subscriptions/" + subscriptions[i]);
            } catch (error) { }
        }
        subscriptions = [];
    })
    it('POST /subscriptions AIrQualityObserved', async () => {
        subid = "urn:ngsi-ld:Subscription:" + Tools.makeid(16)
        subscriptions.push(subid);
        var subscription = {
            "id": subid,
            "description": "Notify me",
            "type": "Subscription",
            "entities": [{ "type": "AirQualityObserved" }],
            "watchedAttributes": ["refDevice"],
            "notification": {
                "attributes": ["refDevice"],
                "endpoint": {
                    "uri": "http://decoderagent:" + port + "/subscription/test/notification",
                    "accept": "application/json"
                }
            },
            "@context": [
                "https://smartdatamodels.org/context.jsonld",
                "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
            ]
        }
        var response = await expect(Tools.sendRequest("POST", "/subscriptions", subscription, "application/ld+json")).to.be.fulfilled;
        expect(response.status).to.be.eql(201);
    })
    it('GET /subscriptions/id => 200 OK', async () => {
        var response = await expect(Tools.sendRequest("GET", "/subscriptions/" + subscriptions[0], "", "application/ld+json", "application/ld+json", "<https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld>; rel=\"http://www.w3.org/ns/json-ld#context\"; type=\"application/ld+json\"")).to.be.fulfilled;
        expect(response.status).to.be.eql(200);
        expect(response.hasOwnProperty("data")).to.be.true
        if (Config.ShowData) console.log(JSON.stringify(response.data, null, 4));
    });
    it('Create the entities AirQualityObserved value and recieve the notification', async () => {
        var entityid = "urn:ngsi-ld:AirQualityObserved:Madrid-AmbientObserved:" + Tools.makeid(16);;
        entities.push(entityid);
        var entity = {
            "id": entityid,
            "type": "AirQualityObserved",
            "dateObserved": {
              "type": "Property",
              "value": "2016-03-15T11:00:00Z"
            },
            "co2": {
              "type": "Property",
              "value": 500,
              "unitCode": "PPM",
              "observedAt": "2016-03-15T11:00:00Z"
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
                "object": "urn:ngsi-ld:Device:chirpstack:000000"
            },
            "@context": [
              "https://smartdatamodels.org/context.jsonld",
              "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
            ]
          }
        var request = {
            method: 'POST',
            url: Config.OrionAPI + "/ngsi-ld/v1/entities",
            headers: {
                "Content-Type": "application/ld+json"
            },
            data: JSON.stringify(entity),
            json: true
        };
        var response = await expect(Subscribe.call(request, 201, 8000, 500)).to.be.fulfilled;
        expect(response.hasOwnProperty("body")).to.be.true;
        expect(response.method).to.be.eql("POST");
        expect(response.url).to.be.eql("/subscription/test/notification");
        var notification = JSON.parse(response.body)
        if (Config.ShowData) console.log(JSON.stringify(notification, null, 4));
        expect(Array.isArray(notification.data)).to.be.true
        expect(notification.data[0].hasOwnProperty("id")).to.be.true;
        expect(notification.data[0].id).to.be.eql(entityid);
        expect(notification.hasOwnProperty("id")).to.be.true;
        expect(notification.hasOwnProperty("notifiedAt")).to.be.true;
    });
    it('Update the object with complex value and recieve the notification', async () => {
        var entity = {
            "dateObserved": {
              "type": "Property",
              "value": "2016-03-16T11:00:00Z"
            },
            "co2": {
              "type": "Property",
              "value": 400,
              "unitCode": "PPM",
              "observedAt": "2016-03-16T11:00:00Z"
            },
            "@context": [
              "https://smartdatamodels.org/context.jsonld",
              "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
            ]
          }
        var request = {
            method: 'PATCH',
            url: Config.OrionAPI + "/ngsi-ld/v1/entities/" + entities[0] + "/attrs",
            headers: {
                "Content-Type": "application/ld+json"
            },
            data: JSON.stringify(entity),
            json: true
        };
        var response = await expect(Subscribe.call(request, 204, 8000, 500)).to.be.fulfilled;
        expect(response.hasOwnProperty("body")).to.be.true;
        expect(response.method).to.be.eql("POST");
        expect(response.url).to.be.eql("/subscription/test/notification");
        var notification = JSON.parse(response.body)
        if (Config.ShowData) console.log(JSON.stringify(notification, null, 4));
        expect(Array.isArray(notification.data)).to.be.true
        expect(notification.data[0].hasOwnProperty("id")).to.be.true;
        expect(notification.data[0].id).to.be.eql(entities[0]);
        expect(notification.hasOwnProperty("id")).to.be.true;
        expect(notification.hasOwnProperty("notifiedAt")).to.be.true;
    });


    it('POST /subscriptions Device', async () => {
        subid = "urn:ngsi-ld:Subscription:urn:ngsi-ld:Device:chirpstack:00000"
        subscriptions.push(subid);
        var subscription = {
            "id": subid,
            "description": "Notify me",
            "type": "Subscription",
            "entities": [{ 
                "id": "urn:ngsi-ld:Device:chirpstack:00000",
                "type": "Device" 
            }
            ],
            "watchedAttributes": ["value"],
            "notification": {
                "attributes": ["value"],
                "endpoint": {
                    "uri": "http://decoderagent:" + port + "/subscription/device/urn:ngsi-ld:Device:chirpstack:00000",
                    "accept": "application/json"
                }
            },
            "@context": [
                "https://smartdatamodels.org/context.jsonld",
                "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
            ]
        }
        var response = await expect(Tools.sendRequest("POST", "/subscriptions", subscription, "application/ld+json")).to.be.fulfilled;
        expect(response.status).to.be.eql(201);
    })
    it('GET /subscriptions/id => 200 OK', async () => {
        var response = await expect(Tools.sendRequest("GET", "/subscriptions/" + subscriptions[1], "", "application/ld+json", "application/ld+json", "<https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld>; rel=\"http://www.w3.org/ns/json-ld#context\"; type=\"application/ld+json\"")).to.be.fulfilled;
        expect(response.status).to.be.eql(200);
        expect(response.hasOwnProperty("data")).to.be.true
        if (Config.ShowData) console.log(JSON.stringify(response.data, null, 4));
    });
    it('Create the entities Device value and recieve the notification', async () => {
        var entityid = "urn:ngsi-ld:Device:chirpstack:00000";
        entities.push(entityid);
        var entity = {
            "id": entityid ,
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
                    "@value": "2016-03-16T11:00:00Z"
                }
            },
            "dateLastValueReported": {
                "type": "Property",
                "value": {
                    "@type": "DateTime",
                    "@value": "2016-03-16T11:00:00Z"
                }
            },
            "serialNumber": {
                "type": "Property",
                "value": "000000"
            },
            "value": {
                "type": "Property",
                "value": "F3oAug=="
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
            "@context": [
                "https://smartdatamodels.org/context.jsonld"
            ]
        }
        var request = {
            method: 'POST',
            url: Config.OrionAPI + "/ngsi-ld/v1/entities",
            headers: {
                "Content-Type": "application/ld+json"
            },
            data: JSON.stringify(entity),
            json: true
        };
        var response = await expect(Subscribe.call(request, 201, 8000, 500)).to.be.fulfilled;
        expect(response.hasOwnProperty("body")).to.be.true;
        expect(response.method).to.be.eql("POST");
        expect(response.url).to.be.eql("/subscription/device/urn:ngsi-ld:Device:chirpstack:00000");
        expect(response.hasOwnProperty("deviceid")).to.be.true;
        expect(response.deviceid).to.be.eql("urn:ngsi-ld:Device:chirpstack:00000");
        var notification = JSON.parse(response.body)
        if (Config.ShowData) console.log(JSON.stringify(notification, null, 4));
        expect(Array.isArray(notification.data)).to.be.true
        expect(notification.data[0].hasOwnProperty("id")).to.be.true;
        expect(notification.data[0].id).to.be.eql(entityid);
        expect(notification.hasOwnProperty("id")).to.be.true;
        expect(notification.hasOwnProperty("notifiedAt")).to.be.true;
    });
    it('Update the object with complex value and recieve the notification', async () => {
        var entity = {
            "@context": [
                "https://smartdatamodels.org/context.jsonld"
            ],
            "value": {
                "type": "Property",
                "value": "Value2",
                "observedAt": "2016-04-16T11:00:00Z",
            },
            "dateLastValueReported": {
                "type": "Property",
                "value": {
                    "@type": "DateTime",
                    "@value": "2016-04-16T11:00:00Z"
                }
            }
        }
        var request = {
            method: 'PATCH',
            url: Config.OrionAPI + "/ngsi-ld/v1/entities/" + entities[1] + "/attrs",
            headers: {
                "Content-Type": "application/ld+json"
            },
            data: JSON.stringify(entity),
            json: true
        };
        var response = await expect(Subscribe.call(request, 204, 8000, 500)).to.be.fulfilled;
        expect(response.hasOwnProperty("body")).to.be.true;
        expect(response.method).to.be.eql("POST");
        expect(response.url).to.be.eql("/subscription/device/urn:ngsi-ld:Device:chirpstack:00000");
        expect(response.hasOwnProperty("deviceid")).to.be.true;
        expect(response.deviceid).to.be.eql("urn:ngsi-ld:Device:chirpstack:00000");
        var notification = JSON.parse(response.body)
        if (Config.ShowData) console.log(JSON.stringify(notification, null, 4));
        expect(Array.isArray(notification.data)).to.be.true
        expect(notification.data[0].hasOwnProperty("id")).to.be.true;
        expect(notification.data[0].id).to.be.eql(entities[1]);
        expect(notification.hasOwnProperty("id")).to.be.true;
        expect(notification.hasOwnProperty("notifiedAt")).to.be.true;
    });
})