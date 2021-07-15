const assert = require('assert');
var Config = require('../config.js')
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

describe('Test Base64 feature', function () {
    this.timeout(5000);

    before(async () => {
    })
    after(async () => {
    })
    it('Test Base64 decode', async () => {
        var text="IjIzAACIiAI="
        const buff = Buffer.from(text, 'base64');

        const texthex = buff.toString('hex');
        expect(texthex).to.be.eql("2232330000888802")
    })

})
