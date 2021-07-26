const assert = require('assert');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;



describe('Binary Test', function () {
    it('Check Number encoding', async () => {
        expect(0B00000001, "0B00000001").to.be.eql(1)
        expect(0B00000010, "0B00000010").to.be.eql(2)
        expect(0B01101010, "0B01101010").to.be.eql(106)
    })
    it('Check mask encoding', async () => {
        expect(0B00000010 | 0B00001000 | 0B00100000 | 0B01000000).to.be.eql(106)
    })
    it('Check mask validation', async () => {
        expect(106 & 0B00000010).to.be.eql(0B00000010)
        expect(106 & 0B00000001).to.be.eql(0)
    })
})