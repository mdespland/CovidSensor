const assert = require('assert');
var Decoder = require('../decoder.js')
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
var ConfigBackup = {};

describe('Test Decoder features', function () {
    this.timeout(10000);
    before(async () => {
        ConfigBackup.AgentListenPort = Config.AgentListenPort;
        ConfigBackup.Devices = Config.Devices;
        ConfigBackup.MainSubscriptionId = Config.MainSubscriptionId
        Config.AgentListenPort = 8284
        Config.Devices = {
            "urn:ngsi-ld:AirQualityObserved:test:Co2:sensor1": "urn:ngsi-ld:Device:chirpstack:test:00000",
            "urn:ngsi-ld:AirQualityObserved:test:Co2:sensor2": "urn:ngsi-ld:Device:chirpstack:test:00001",
            "urn:ngsi-ld:AirQualityObserved:test:Co2:sensor3": "urn:ngsi-ld:Device:chirpstack:test:00002",
            "urn:ngsi-ld:AirQualityObserved:test:Co2:sensor4": "urn:ngsi-ld:Device:chirpstack:test:00000",
        }
        Config.MainSubscriptionId = "urn:ngsi-ld:Subscription:CovidSensor:AirQualityObserved:test"
        Subscribe.listen(Config.AgentListenPort)
        entities.push("urn:ngsi-ld:AirQualityObserved:test:Co2:sensor1")
        entities.push("urn:ngsi-ld:AirQualityObserved:test:Co2:sensor2")
        entities.push("urn:ngsi-ld:AirQualityObserved:test:Co2:sensor3")
        entities.push("urn:ngsi-ld:AirQualityObserved:test:Co2:sensor4")
        entities.push("urn:ngsi-ld:Device:chirpstack:test:00000")
        entities.push("urn:ngsi-ld:Device:chirpstack:test:00001")
        entities.push("urn:ngsi-ld:Device:chirpstack:test:00002")
        subscriptions.push(Config.MainSubscriptionId)
        subscriptions.push(Config.MainSubscriptionId + ":" + "urn:ngsi-ld:Device:chirpstack:test:00000")
        subscriptions.push(Config.MainSubscriptionId + ":" + "urn:ngsi-ld:Device:chirpstack:test:00001")
        subscriptions.push(Config.MainSubscriptionId + ":" + "urn:ngsi-ld:Device:chirpstack:test:00002")
        for (var i = 0; i < entities.length; i++) {
            try {
                await Decoder.sendRequest("DELETE", "/entities/" + entities[i]);
                await Decoder.sendRequest("DELETE", "/temporal/entities/" + entities[i]);
            } catch (error) { }
        }
        for (var i = 0; i < subscriptions.length; i++) {
            try {
                await Decoder.sendRequest("DELETE", "/subscriptions/" + subscriptions[i]);
            } catch (error) { }
        }
    })
    after(async () => {
        Config.AgentListenPort = ConfigBackup.AgentListenPort;
        Config.Devices = ConfigBackup.Devices;
        Config.MainSubscriptionId = ConfigBackup.MainSubscriptionId
        Subscribe.close()
        for (var i = 0; i < entities.length; i++) {
            try {
                await Decoder.sendRequest("DELETE", "/entities/" + entities[i]);
                await Decoder.sendRequest("DELETE", "/temporal/entities/" + entities[i]);
            } catch (error) { }
        }
        for (var i = 0; i < subscriptions.length; i++) {
            try {
                await Decoder.sendRequest("DELETE", "/subscriptions/" + subscriptions[i]);
            } catch (error) { }
        }
        subscriptions = [];
    })
    it('Check Main Subscription false', async () => {
        var response = await expect(Decoder.checkMainSubscription()).to.be.fulfilled;
        expect(response,"subscription should not exists").to.be.eql(false);
    })
    it('Create Main Subscription', async () => {
        var response = await expect(Decoder.createMainSubscription()).to.be.fulfilled;
        expect(response).to.be.eql(true);
    })
    it('GET /subscriptions/id => 200 OK', async () => {
        var response = await expect(Decoder.sendRequest("GET", "/subscriptions/" + Config.MainSubscriptionId, "", "application/ld+json", "application/ld+json", "<https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld>; rel=\"http://www.w3.org/ns/json-ld#context\"; type=\"application/ld+json\"")).to.be.fulfilled;
        expect(response.status).to.be.eql(200);
        expect(response.hasOwnProperty("data")).to.be.true
        if (Config.ShowData) console.log(JSON.stringify(response.data, null, 4));
    });
    it('Check Main Subscription', async () => {
        var response = await expect(Decoder.checkMainSubscription()).to.be.fulfilled;
        expect(response).to.be.eql(true);
    })
    it('Create the entities AirQualityObserved value and recieve the notification', async () => {
        Subscribe.clearResponse()
        await expect(Decoder.createAirQualityObserved("urn:ngsi-ld:AirQualityObserved:test:Co2:sensor3", "urn:ngsi-ld:Device:chirpstack:test:00002")).to.be.fulfilled;
        var response = await (expect(Subscribe.lastResponse())).to.be.fulfilled
        expect(response.hasOwnProperty("body")).to.be.true;
        expect(response.method).to.be.eql("POST");
        expect(response.url).to.be.eql("/subscription/airqualityobserved");
        var notification = JSON.parse(response.body)
        if (Config.ShowData) console.log(JSON.stringify(notification, null, 4));
        expect(Array.isArray(notification.data)).to.be.true
        expect(notification.data[0].hasOwnProperty("id")).to.be.true;
        expect(notification.data[0].id).to.be.eql("urn:ngsi-ld:AirQualityObserved:test:Co2:sensor3");
        expect(notification.hasOwnProperty("id")).to.be.true;
        expect(notification.hasOwnProperty("notifiedAt")).to.be.true;
    });
    it('Update the AirQualityObserved', async () => {
        Subscribe.clearResponse()
        await expect(Decoder.updateAirQualityObserved("urn:ngsi-ld:AirQualityObserved:test:Co2:sensor3", 600, (new Date()).toISOString())).to.be.fulfilled;
        var response = await (expect(Subscribe.lastResponse())).to.be.fulfilled
        expect(response.hasOwnProperty("body")).to.be.true;
        expect(response.method).to.be.eql("POST");
        expect(response.url).to.be.eql("/subscription/airqualityobserved");
        var notification = JSON.parse(response.body)
        if (Config.ShowData) console.log(JSON.stringify(notification, null, 4));
        expect(Array.isArray(notification.data)).to.be.true
        expect(notification.data[0].hasOwnProperty("id")).to.be.true;
        expect(notification.data[0].id).to.be.eql("urn:ngsi-ld:AirQualityObserved:test:Co2:sensor3");
        expect(notification.hasOwnProperty("id")).to.be.true;
        expect(notification.hasOwnProperty("notifiedAt")).to.be.true;
    });


    it('create Device subscription', async () => {
        var response = await expect(Decoder.createDeviceSubscription("urn:ngsi-ld:Device:chirpstack:test:00002")).to.be.fulfilled;
        expect(response).to.be.eql(true);
    })
    it('GET /subscriptions/id => 200 OK', async () => {
        var response = await expect(Decoder.sendRequest("GET", "/subscriptions/" + Config.MainSubscriptionId + ":" + "urn:ngsi-ld:Device:chirpstack:test:00002", "", "application/ld+json", "application/ld+json", "<https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld>; rel=\"http://www.w3.org/ns/json-ld#context\"; type=\"application/ld+json\"")).to.be.fulfilled;
        expect(response.status).to.be.eql(200);
        expect(response.hasOwnProperty("data")).to.be.true
        if (Config.ShowData) console.log(JSON.stringify(response.data, null, 4));
    });
    it('check Device subscription', async () => {
        var response = await expect(Decoder.checkDeviceSubscription("urn:ngsi-ld:Device:chirpstack:test:00002")).to.be.fulfilled;
        expect(response).to.be.eql(true);
    })
    it('Create the entities Device value and recieve the notification', async () => {
        var entityid = "urn:ngsi-ld:Device:chirpstack:test:00002";
        var entity = {
            "id": entityid,
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
        expect(response.url).to.be.eql("/subscription/device/urn:ngsi-ld:Device:chirpstack:test:00002");
        expect(response.hasOwnProperty("deviceid")).to.be.true;
        expect(response.deviceid).to.be.eql("urn:ngsi-ld:Device:chirpstack:test:00002");
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
            url: Config.OrionAPI + "/ngsi-ld/v1/entities/" + "urn:ngsi-ld:Device:chirpstack:test:00002" + "/attrs",
            headers: {
                "Content-Type": "application/ld+json"
            },
            data: JSON.stringify(entity),
            json: true
        };
        var response = await expect(Subscribe.call(request, 204, 8000, 500)).to.be.fulfilled;
        expect(response.hasOwnProperty("body")).to.be.true;
        expect(response.method).to.be.eql("POST");
        expect(response.url).to.be.eql("/subscription/device/urn:ngsi-ld:Device:chirpstack:test:00002");
        expect(response.hasOwnProperty("deviceid")).to.be.true;
        expect(response.deviceid).to.be.eql("urn:ngsi-ld:Device:chirpstack:test:00002");
        var notification = JSON.parse(response.body)
        if (Config.ShowData) console.log(JSON.stringify(notification, null, 4));
        expect(Array.isArray(notification.data)).to.be.true
        expect(notification.data[0].hasOwnProperty("id")).to.be.true;
        expect(notification.data[0].id).to.be.eql("urn:ngsi-ld:Device:chirpstack:test:00002");
        expect(notification.hasOwnProperty("id")).to.be.true;
        expect(notification.hasOwnProperty("notifiedAt")).to.be.true;
    });
    it('Check init', async () => {
        var response;
        await expect(Decoder.init()).to.be.fulfilled;
        response = await expect(Decoder.checkMainSubscription()).to.be.fulfilled;
        expect(response,"Main subscription").to.be.eql(true);
        response = await expect(Decoder.checkDeviceSubscription("urn:ngsi-ld:Device:chirpstack:test:00000")).to.be.fulfilled;
        expect(response,"Device subscription urn:ngsi-ld:Device:chirpstack:test:00000").to.be.eql(true);
        response = await expect(Decoder.checkDeviceSubscription("urn:ngsi-ld:Device:chirpstack:test:00001")).to.be.fulfilled;
        expect(response,"Device subscription urn:ngsi-ld:Device:chirpstack:test:00001").to.be.eql(true);
        response = await expect(Decoder.checkDeviceSubscription("urn:ngsi-ld:Device:chirpstack:test:00002")).to.be.fulfilled;
        expect(response,"Device subscription urn:ngsi-ld:Device:chirpstack:test:00002").to.be.eql(true);
        response = await expect(Decoder.checkAirQualityObserved("urn:ngsi-ld:AirQualityObserved:test:Co2:sensor1", "urn:ngsi-ld:Device:chirpstack:test:00000")).to.be.fulfilled;
        expect(response,"Device subscription urn:ngsi-ld:AirQualityObserved:test:Co2:sensor1").to.be.eql(true);
        response = await expect(Decoder.checkAirQualityObserved("urn:ngsi-ld:AirQualityObserved:test:Co2:sensor2", "urn:ngsi-ld:Device:chirpstack:test:00001")).to.be.fulfilled;
        expect(response,"Device subscription urn:ngsi-ld:AirQualityObserved:test:Co2:sensor2").to.be.eql(true);
        response = await expect(Decoder.checkAirQualityObserved("urn:ngsi-ld:AirQualityObserved:test:Co2:sensor3", "urn:ngsi-ld:Device:chirpstack:test:00002")).to.be.fulfilled;
        expect(response,"Device subscription urn:ngsi-ld:AirQualityObserved:test:Co2:sensor3").to.be.eql(true);
        response = await expect(Decoder.checkAirQualityObserved("urn:ngsi-ld:AirQualityObserved:test:Co2:sensor4", "urn:ngsi-ld:Device:chirpstack:test:00000")).to.be.fulfilled;
        expect(response,"Device subscription urn:ngsi-ld:AirQualityObserved:test:Co2:sensor4").to.be.eql(true);
    })
    it('Check searchAirQualityObserved', async () => {
        var response = await expect(Decoder.searchAirQualityObserved("urn:ngsi-ld:Device:chirpstack:test:00000")).to.be.fulfilled;
        if (Config.ShowData) console.log(JSON.stringify(response, null, 4));
        expect(Array.isArray(response)).to.be.true
        expect(response.length).to.be.eql(2)
    })
    it('GET urn:ngsi-ld:AirQualityObserved:test:Co2:sensor1 => 200 OK', async () => {
        var response = await expect(Decoder.sendRequest("GET", "/entities/urn:ngsi-ld:AirQualityObserved:test:Co2:sensor1", "", "application/ld+json", "application/ld+json", "<https://smartdatamodels.org/context.jsonld>; rel=\"http://www.w3.org/ns/json-ld#context\"; type=\"application/ld+json\"")).to.be.fulfilled;
        expect(response.status).to.be.eql(200);
        expect(response.hasOwnProperty("data")).to.be.true
        if (Config.ShowData) console.log(JSON.stringify(response.data, null, 4));
        expect(response.data.hasOwnProperty("co2"), "co2").to.be.true
        expect(response.data.co2).to.be.eql({
            "type": "Property",
            "value": 400,
            "unitCode": "PPM"
        })        
    });
    it('GET urn:ngsi-ld:AirQualityObserved:test:Co2:sensor4 => 200 OK', async () => {
        var response = await expect(Decoder.sendRequest("GET", "/entities/urn:ngsi-ld:AirQualityObserved:test:Co2:sensor4", "", "application/ld+json", "application/ld+json", "<https://smartdatamodels.org/context.jsonld>; rel=\"http://www.w3.org/ns/json-ld#context\"; type=\"application/ld+json\"")).to.be.fulfilled;
        expect(response.status).to.be.eql(200);
        expect(response.hasOwnProperty("data")).to.be.true
        if (Config.ShowData) console.log(JSON.stringify(response.data, null, 4));
        expect(response.data.hasOwnProperty("co2"), "co2").to.be.true
        expect(response.data.co2).to.be.eql({
            "type": "Property",
            "value": 400,
            "unitCode": "PPM"
        })        
    });
    it('Check pushDeviceData', async () => {
        await expect(Decoder.pushDeviceData("urn:ngsi-ld:Device:chirpstack:test:00000","F3oAug==","2016-03-15T11:00:00.000Z")).to.be.fulfilled;
    })
    it('GET urn:ngsi-ld:AirQualityObserved:test:Co2:sensor1 => 200 OK', async () => {
        var response = await expect(Decoder.sendRequest("GET", "/entities/urn:ngsi-ld:AirQualityObserved:test:Co2:sensor1", "", "application/ld+json", "application/ld+json", "<https://smartdatamodels.org/context.jsonld>; rel=\"http://www.w3.org/ns/json-ld#context\"; type=\"application/ld+json\"")).to.be.fulfilled;
        expect(response.status).to.be.eql(200);
        expect(response.hasOwnProperty("data")).to.be.true
        if (Config.ShowData) console.log(JSON.stringify(response.data, null, 4));
        expect(response.data.hasOwnProperty("co2"), "co2").to.be.true
        expect(response.data.co2).to.be.eql({
            "type": "Property",
            "value": 6010,
            "unitCode": "PPM",
            "observedAt": "2016-03-15T11:00:00.000Z"
        })        
    });
    it('GET urn:ngsi-ld:AirQualityObserved:test:Co2:sensor4 => 200 OK', async () => {
        var response = await expect(Decoder.sendRequest("GET", "/entities/urn:ngsi-ld:AirQualityObserved:test:Co2:sensor4", "", "application/ld+json", "application/ld+json", "<https://smartdatamodels.org/context.jsonld>; rel=\"http://www.w3.org/ns/json-ld#context\"; type=\"application/ld+json\"")).to.be.fulfilled;
        expect(response.status).to.be.eql(200);
        expect(response.hasOwnProperty("data")).to.be.true
        if (Config.ShowData) console.log(JSON.stringify(response.data, null, 4));
        expect(response.data.hasOwnProperty("co2"), "co2").to.be.true
        expect(response.data.co2).to.be.eql({
            "type": "Property",
            "value": 6010,
            "unitCode": "PPM",
            "observedAt": "2016-03-15T11:00:00.000Z"
        })        
    });
})