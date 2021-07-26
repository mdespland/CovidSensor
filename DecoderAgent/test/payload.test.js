const assert = require('assert');
var Decoder = require('../decoder.js')
var Config = require('../config.js')
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;


const MASK_CO2 = 0B00000001
const MASK_TVOC = 0B00000010
const MASK_VOLTAGE = 0B00000100
const MASK_TEMPERATURE = 0B00001000
const MASK_HUMIDITY = 0B00010000
const MASK_PRESSURE = 0B00100000
const MASK_ALTITUDE = 0B01000000

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


const MASK_CO2 = 0B00000001
const MASK_TVOC = 0B00000010
const MASK_VOLTAGE = 0B00000100
const MASK_TEMPERATURE = 0B00001000
const MASK_HUMIDITY = 0B00010000
const MASK_PRESSURE = 0B00100000
const MASK_ALTITUDE = 0B01000000
    it('Encode Lora Payload KQG4ABkEOA==', async () => {
        var buff=Buffer.allocUnsafe(7);
        buff.writeUInt8(MASK_CO2 | MASK_TEMPERATURE | MASK_PRESSURE, 0);
        buff.writeUInt8(Math.floor(440/256),1)
        buff.writeUInt8(440 % 256,2)
        buff.writeUInt8(Math.floor(25/256),3)
        buff.writeUInt8(25 % 256 ,4)
        buff.writeUInt8(Math.floor(1080/256),5)
        buff.writeUInt8(1080 % 256,6)
        expect(buff.readUInt8(0) & MASK_CO2).to.be.eql(MASK_CO2)
        expect(buff.readUInt8(0) & MASK_TVOC).to.be.eql(0)
        expect(buff.readUInt8(0) & MASK_VOLTAGE).to.be.eql(0)
        expect(buff.readUInt8(0) & MASK_TEMPERATURE ).to.be.eql(MASK_TEMPERATURE)
        expect(buff.readUInt8(0) & MASK_HUMIDITY).to.be.eql(0)
        expect(buff.readUInt8(0) & MASK_PRESSURE).to.be.eql(MASK_PRESSURE)
        expect(buff.readUInt8(0) & MASK_ALTITUDE).to.be.eql(0)
        expect(buff.readUInt8(1) * 256 + buff.readUInt8(2)).to.be.eql(440)
        expect(buff.readUInt8(3) * 256 + buff.readUInt8(4)).to.be.eql(25)
        expect(buff.readUInt8(5) * 256 + buff.readUInt8(6)).to.be.eql(1080)
        expect(buff.toString('base64')).to.be.eql("KQG4ABkEOA==")
        if ((buff.readUInt8(0) & MASK_CO2) === MASK_CO2) console.log("HAVE CO2")
        if ((buff.readUInt8(0) & MASK_TVOC) === MASK_TVOC) console.log("HAVE TVOC")
        if ((buff.readUInt8(0) & MASK_VOLTAGE) === MASK_VOLTAGE) console.log("HAVE VOLTAGE")
        if ((buff.readUInt8(0) & MASK_TEMPERATURE) === MASK_TEMPERATURE) console.log("HAVE TEMPERATURE")
        if ((buff.readUInt8(0) & MASK_HUMIDITY) === MASK_HUMIDITY) console.log("HAVE HUMIDITY")
        if ((buff.readUInt8(0) & MASK_PRESSURE) === MASK_PRESSURE) console.log("HAVE PRESSURE")
        if ((buff.readUInt8(0) & MASK_ALTITUDE) === MASK_ALTITUDE) console.log("HAVE ALTITUDE")

    })

    it('Encode Lora Payload fwG6ABEHZwAaADgEOgDd', async () => {
        var buff=Buffer.allocUnsafe(15);
        buff.writeUInt8(MASK_CO2 | MASK_TVOC | MASK_VOLTAGE | MASK_TEMPERATURE | MASK_HUMIDITY | MASK_PRESSURE | MASK_ALTITUDE, 0);
        buff.writeUInt8(Math.floor(442/256),1)
        buff.writeUInt8(442 % 256,2)
        buff.writeUInt8(Math.floor(17/256),3)
        buff.writeUInt8(17 % 256 ,4)
        buff.writeUInt8(Math.floor(1895/256),5)
        buff.writeUInt8(1895 % 256,6)
        buff.writeUInt8(Math.floor(26/256),7)
        buff.writeUInt8(26 % 256,8)
        buff.writeUInt8(Math.floor(56/256),9)
        buff.writeUInt8(56 % 256,10)
        buff.writeUInt8(Math.floor(1082/256),11)
        buff.writeUInt8(1082 % 256,12)
        buff.writeUInt8(Math.floor(221/256),13)
        buff.writeUInt8(221 % 256,14)
        expect(buff.readUInt8(0) & MASK_CO2).to.be.eql(MASK_CO2)
        expect(buff.readUInt8(0) & MASK_TVOC).to.be.eql(MASK_TVOC)
        expect(buff.readUInt8(0) & MASK_VOLTAGE).to.be.eql(MASK_VOLTAGE)
        expect(buff.readUInt8(0) & MASK_TEMPERATURE ).to.be.eql(MASK_TEMPERATURE)
        expect(buff.readUInt8(0) & MASK_HUMIDITY).to.be.eql(MASK_HUMIDITY)
        expect(buff.readUInt8(0) & MASK_PRESSURE).to.be.eql(MASK_PRESSURE)
        expect(buff.readUInt8(0) & MASK_ALTITUDE).to.be.eql(MASK_ALTITUDE)
        var indice=1;
        expect(buff.readUInt8(indice) * 256 + buff.readUInt8(indice+1)).to.be.eql(442)
        indice+=2
        expect(buff.readUInt8(indice) * 256 + buff.readUInt8(indice+1)).to.be.eql(17)
        indice+=2
        expect(buff.readUInt8(indice) * 256 + buff.readUInt8(indice+1)).to.be.eql(1895)
        indice+=2
        expect(buff.readUInt8(indice) * 256 + buff.readUInt8(indice+1)).to.be.eql(26)
        indice+=2
        expect(buff.readUInt8(indice) * 256 + buff.readUInt8(indice+1)).to.be.eql(56)
        indice+=2
        expect(buff.readUInt8(indice) * 256 + buff.readUInt8(indice+1)).to.be.eql(1082)
        indice+=2
        expect(buff.readUInt8(indice) * 256 + buff.readUInt8(indice+1)).to.be.eql(221)
        indice+=2
        expect(buff.toString('base64')).to.be.eql("fwG6ABEHZwAaADgEOgDd")
    })
    it('Encode Lora Payload fwG9ABYFsAAcAC0CZgAA', async () => {
        var buff=Buffer.allocUnsafe(15);
        buff.writeUInt8(MASK_CO2 | MASK_TVOC | MASK_VOLTAGE | MASK_TEMPERATURE | MASK_HUMIDITY | MASK_PRESSURE | MASK_ALTITUDE, 0);
        buff.writeUInt8(Math.floor(445/256),1)
        buff.writeUInt8(445 % 256,2)
        buff.writeUInt8(Math.floor(22/256),3)
        buff.writeUInt8(22 % 256 ,4)
        buff.writeUInt8(Math.floor(1456/256),5)
        buff.writeUInt8(1456 % 256,6)
        buff.writeUInt8(Math.floor(28/256),7)
        buff.writeUInt8(28 % 256,8)
        buff.writeUInt8(Math.floor(45/256),9)
        buff.writeUInt8(45 % 256,10)
        buff.writeUInt8(Math.floor(614/256),11)
        buff.writeUInt8(614 % 256,12)
        buff.writeUInt8(Math.floor(0/256),13)
        buff.writeUInt8(0 % 256,14)
        expect(buff.readUInt8(0) & MASK_CO2).to.be.eql(MASK_CO2)
        expect(buff.readUInt8(0) & MASK_TVOC).to.be.eql(MASK_TVOC)
        expect(buff.readUInt8(0) & MASK_VOLTAGE).to.be.eql(MASK_VOLTAGE)
        expect(buff.readUInt8(0) & MASK_TEMPERATURE ).to.be.eql(MASK_TEMPERATURE)
        expect(buff.readUInt8(0) & MASK_HUMIDITY).to.be.eql(MASK_HUMIDITY)
        expect(buff.readUInt8(0) & MASK_PRESSURE).to.be.eql(MASK_PRESSURE)
        expect(buff.readUInt8(0) & MASK_ALTITUDE).to.be.eql(MASK_ALTITUDE)
        var indice=1;
        expect(buff.readUInt8(indice) * 256 + buff.readUInt8(indice+1)).to.be.eql(445)
        indice+=2
        expect(buff.readUInt8(indice) * 256 + buff.readUInt8(indice+1)).to.be.eql(22)
        indice+=2
        expect(buff.readUInt8(indice) * 256 + buff.readUInt8(indice+1)).to.be.eql(1456)
        indice+=2
        expect(buff.readUInt8(indice) * 256 + buff.readUInt8(indice+1)).to.be.eql(28)
        indice+=2
        expect(buff.readUInt8(indice) * 256 + buff.readUInt8(indice+1)).to.be.eql(45)
        indice+=2
        expect(buff.readUInt8(indice) * 256 + buff.readUInt8(indice+1)).to.be.eql(614)
        indice+=2
        expect(buff.readUInt8(indice) * 256 + buff.readUInt8(indice+1)).to.be.eql(0)
        indice+=2
        expect(buff.toString('base64')).to.be.eql("fwG9ABYFsAAcAC0CZgAA")
    })
})
