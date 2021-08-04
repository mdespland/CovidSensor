
const assert = require('assert');
var Config = require('../config.js')
var Chirpstack = require('../chirpstack.js')
var OrionLD = require('../orion-ld.js')
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

const MQTT = require("async-mqtt");

var client;

describe('MQTT Test', function () {
this.timeout(5000);

    before(async () => {
    })
    after(async () => {
        try {
            await OrionLD.deleteEntity("urn:ngsi-ld:Device:chirpstack:000000")
        }catch(error) {

        }
    })
    it('Test connect', async () => {
        client= await expect(MQTT.connectAsync(Config.MqttURL)).to.be.fulfilled
    })

    it('Test read on channel', async () => {
        client.on('message', (topic, message) => console.log(topic, message.toString()))
		await expect(client.subscribe("#")).to.be.fulfilled
    })
    it('Test send payload', async () => {
        var payload={
            "confirmed": false, 
            "fPort": 5,
            "data": "AAAAAAAA" 
        }
        await expect(client.publish("application/2/device/0004a30b001f3423/command/down", JSON.stringify(payload))).to.be.fulfilled
    })



    it('Test disconnect', async () => {
        //await expect(client.end()).to.be.fulfilled
    })
});