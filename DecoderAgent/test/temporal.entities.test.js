const assert = require('assert');
var Tools = require('./common.js')
var Config = require('../config.js')
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

var entities = [];
var csources = [];
var subscriptions = [];
var sourceSubscriptions = [];
var lastentity = {};

describe('Test Temporal Entities worklow to work with ORION-LD + MINTAKA', function () {
    this.timeout(10000);
    before(async () => {

    })
    after(async () => {
        for (var i = 0; i < entities.length; i++) {
            try {
                await Tools.sendRequest("DELETE", "/entities/" + entities[i]);
                await Tools.sendRequest("DELETE", "/temporal/entities/" + entities[i]);
            } catch (error) { }
        }
        entities = [];
    })
    it('Create the entities', async () => {
        var entityid = "uurn:ngsi-ld:AirQualityObserved:Madrid-AmbientObserved:" + Tools.makeid(16);;
        entities.push(entityid);
        lastentity = {
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
        var response = await expect(Tools.sendRequest("POST", "/entities", lastentity, "application/ld+json")).to.be.fulfilled;
        expect(response.status).to.be.eql(201);
        await Tools.sleep(500);
    });
    it('GET /entities/id => 200 OK', async () => {
        var response = await expect(Tools.sendRequest("GET", "/entities/" + lastentity.id, "", "application/ld+json", "application/ld+json", "<https://smartdatamodels.org/context.jsonld>; rel=\"http://www.w3.org/ns/json-ld#context\"; type=\"application/ld+json\"")).to.be.fulfilled;
        expect(response.status).to.be.eql(200);
        expect(response.hasOwnProperty("data")).to.be.true
        if (Config.ShowData) console.log(JSON.stringify(response.data, null, 4));
        expect(response.data.hasOwnProperty("co2"), "co2").to.be.true
        expect(response.data.co2).to.be.eql({
            "type": "Property",
            "value": 500,
            "unitCode": "PPM",
            "observedAt": "2016-03-15T11:00:00.000Z"
        })        
    });
    it('Update the entities', async () => {
        var attributes = {
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
        var response = await expect(Tools.sendRequest("PATCH", "/entities/"+lastentity.id+"/attrs", attributes, "application/ld+json")).to.be.fulfilled;
        expect(response.status).to.be.eql(204);
        await Tools.sleep(500);
    });
    it('GET /entities/id => 200 OK', async () => {
        var response = await expect(Tools.sendRequest("GET", "/entities/" + lastentity.id, "", "application/ld+json", "application/ld+json", "<https://smartdatamodels.org/context.jsonld>; rel=\"http://www.w3.org/ns/json-ld#context\"; type=\"application/ld+json\"")).to.be.fulfilled;
        expect(response.status).to.be.eql(200);
        expect(response.hasOwnProperty("data")).to.be.true
        if (Config.ShowData) console.log(JSON.stringify(response.data, null, 4));
        expect(response.data.hasOwnProperty("co2"), "co2").to.be.true
        expect(response.data.co2).to.be.eql({
            "type": "Property",
            "value": 400,
            "unitCode": "PPM",
            "observedAt": "2016-03-16T11:00:00.000Z"
        })        
    });
    it('GET /temporal/entities/id => 200 OK', async () => {
        var response = await expect(Tools.sendRequest("GET", "/temporal/entities/"+ lastentity.id, "", "application/ld+json", "application/ld+json", "<https://smartdatamodels.org/context.jsonld>; rel=\"http://www.w3.org/ns/json-ld#context\"; type=\"application/ld+json\"")).to.be.fulfilled;
        expect(response.status).to.be.eql(200);
        expect(response.hasOwnProperty("data")).to.be.true
        if (Config.ShowData) console.log(JSON.stringify(response.data, null, 4));
        expect(response.data.hasOwnProperty("co2"), "co2").to.be.true
        expect(Array.isArray(response.data.co2)).to.be.true;
        expect(response.data.co2.length).to.be.eql(2);
    });
    it('Update the entities', async () => {
        var attributes = {
            "dateObserved": {
              "type": "Property",
              "value": "2016-03-17T11:00:00Z"
            },
            "co2": {
              "type": "Property",
              "value": 600,
              "unitCode": "PPM",
              "observedAt": "2016-03-17T11:00:00Z"
            },
            "@context": [
              "https://smartdatamodels.org/context.jsonld",
              "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
            ]
          }
        var response = await expect(Tools.sendRequest("PATCH", "/entities/"+lastentity.id+"/attrs", attributes, "application/ld+json")).to.be.fulfilled;
        expect(response.status).to.be.eql(204);
        await Tools.sleep(500);
    });
    it('GET /temporal/entities/id?timeAt=2016-03-16T00:00:00Z&timerel=after => 200 OK', async () => {
        var response = await expect(Tools.sendRequest("GET", "/temporal/entities/"+ lastentity.id+"?timeAt=2016-03-16T00:00:00Z&timerel=after&attrs=co2", "", "application/ld+json", "application/ld+json", "<https://smartdatamodels.org/context.jsonld>; rel=\"http://www.w3.org/ns/json-ld#context\"; type=\"application/ld+json\"")).to.be.fulfilled;
        expect(response.status).to.be.eql(200);
        expect(response.hasOwnProperty("data")).to.be.true
        if (Config.ShowData) console.log(JSON.stringify(response.data, null, 4));
        expect(response.data.hasOwnProperty("co2"), "co2").to.be.true
        expect(Array.isArray(response.data.co2)).to.be.true;
        expect(response.data.co2.length).to.be.eql(2);
    });
    it('GET /temporal/entities/?id=<id>&timeAt=2016-03-16T00:00:00Z&timerel=after => 200 OK', async () => {
        var response = await expect(Tools.sendRequest("GET", "/temporal/entities?id="+ lastentity.id+"&timeAt=2016-03-16T00:00:00Z&timerel=after&attrs=co2", "", "application/ld+json", "application/ld+json", "<https://smartdatamodels.org/context.jsonld>; rel=\"http://www.w3.org/ns/json-ld#context\"; type=\"application/ld+json\"")).to.be.fulfilled;
        expect(response.status).to.be.eql(200);
        expect(response.hasOwnProperty("data")).to.be.true
        if (Config.ShowData) console.log(JSON.stringify(response.data, null, 4));
        expect(response.data[0].hasOwnProperty("co2"), "co2").to.be.true
        expect(Array.isArray(response.data[0].co2)).to.be.true;
        expect(response.data[0].co2.length).to.be.eql(2);
    });
    it('GET /temporal/entities/id?timeAt=2016-03-16T00:00:00Z&timerel=after&attrs=co2&options=temporalValues => 200 OK', async () => {
        var response = await expect(Tools.sendRequest("GET", "/temporal/entities/"+ lastentity.id+"?timeAt=2016-03-16T00:00:00Z&timerel=after&attrs=co2&options=temporalValues", "", "application/ld+json", "application/ld+json", "<https://smartdatamodels.org/context.jsonld>; rel=\"http://www.w3.org/ns/json-ld#context\"; type=\"application/ld+json\"")).to.be.fulfilled;
        expect(response.status).to.be.eql(200);
        expect(response.hasOwnProperty("data")).to.be.true
        if (Config.ShowData) console.log(JSON.stringify(response.data, null, 4));
        expect(response.data.hasOwnProperty("co2"), "co2").to.be.true
        expect(response.data.co2).to.be.eql({
            "type": "Property",
            "values": [
                [
                    400,
                    "2016-03-16T11:00:00Z"
                ],
                [
                    600,
                    "2016-03-17T11:00:00Z"
                ]
            ]
        });
    });
})