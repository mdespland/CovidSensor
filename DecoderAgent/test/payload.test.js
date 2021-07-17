const assert = require('assert');
var Decoder = require('../decoder.js')
var Config = require('../config.js')
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;


describe('Test Lora Payload decodage', function () {
    //this.timeout(10000);
    before(async () => {

    })
    after(async () => {

    })
    it('Decode Lora Payload G3UAtg==', async () => {
        var value="G3UAtg=="
        const buff = Buffer.from(value, 'base64');
        expect(buff.length).to.be.eql(4)
        expect(buff.readUInt8(0)).to.be.eql(27)
        expect(buff.readUInt8(1)).to.be.eql(117)
        expect(buff.readUInt8(2)).to.be.eql(0)
        expect(buff.readUInt8(3)).to.be.eql(182)
        var ppm=buff.readUInt8(0)*256+buff.readUInt8(1);
        var volts=buff.readUInt8(2)*256+buff.readUInt8(3);
        expect(ppm).to.be.eql(7029)
        expect(volts).to.be.eql(182)


    })
    

    it('Decode Lora Payload F3oAug==', async () => {
        var value="F3oAug=="
        const buff = Buffer.from(value, 'base64');
        expect(buff.length).to.be.eql(4)
        expect(buff.readUInt8(0)).to.be.eql(23)
        expect(buff.readUInt8(1)).to.be.eql(122)
        expect(buff.readUInt8(2)).to.be.eql(0)
        expect(buff.readUInt8(3)).to.be.eql(186)
        var ppm=buff.readUInt8(0)*256+buff.readUInt8(1);
        var volts=buff.readUInt8(2)*256+buff.readUInt8(3);
        expect(ppm).to.be.eql(6010)
        expect(volts).to.be.eql(186)


    })
})
