const assert = require('assert');
var OAuth2 = require('../oauth2.js')
var Config = require('../config.js')
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

var config_token="";

describe('Test OAuth2 features', function () {
    before(async () => {
        Config.OAuth2Bearer="mybearer"
        Config.ConfigPassword="config"
        Config.DefaultToken="default"
        Config.AgentToken="agent"
    })
    it('Check Invalid Bearer', async () => {
        await expect(OAuth2.token("configuration", "config", "WRONG")).to.be.rejected;
    })
    it('Check Invalid User', async () => {
        await expect(OAuth2.token("WRONG", "config", "mybearer")).to.be.rejected;
    })
    it('Check Invalid Password', async () => {
        await expect(OAuth2.token("configuration", "WRONG", "mybearer")).to.be.rejected;
    })
    it('Check valid credentials', async () => {
        config_token=await expect(OAuth2.token("configuration", "config", "mybearer")).to.be.fulfilled;
        expect(config_token.length).to.be.eql(32);
    })
    it('Check wrong token', async () => {
        var authorize=await expect(OAuth2.authorize("WRONG", "GET", "", "")).to.be.fulfilled;
        expect(authorize).to.be.false
    })
    it('Check default token with POST', async () => {
        var authorize=await expect(OAuth2.authorize("default", "POST", "", "")).to.be.fulfilled;
        expect(authorize).to.be.false
    })
    it('Check default token with GET', async () => {
        var authorize=await expect(OAuth2.authorize("default", "GET", "", "")).to.be.fulfilled;
        expect(authorize).to.be.true
    })
    it('Check agent token with POST', async () => {
        var authorize=await expect(OAuth2.authorize("agent", "POST", "", "")).to.be.fulfilled;
        expect(authorize).to.be.true
    })
    it('Check config token with POST', async () => {
        var authorize=await expect(OAuth2.authorize(config_token, "POST", "", "")).to.be.fulfilled;
        expect(authorize).to.be.true
    })
})