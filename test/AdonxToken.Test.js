const BigNumber = web3.BigNumber;


const AdonxToken = artifacts.require('AdonxToken');

require('chai')
    .use(require('chai-bignumber')(BigNumber))
    .should();

contract('AdonxToken',  function ([_]) {
    const _name         = 'AdonxToken';
    const _symbol       = 'ADONX';
    const _decimals     = 18;
    const _supply       = '21000000000000000000000000';
    
    beforeEach(async function () {
        this.token = await AdonxToken.new(_name, _symbol, _decimals, _supply);
    });

    describe('Token attributes', function () {
        it('has the correct name', async function () {
            const name = await this.token.name();
            name.should.equal(_name);
        });

        it('has the correct symbol', async function () {
            const symbol = await this.token.symbol();
            symbol.should.equal(_symbol);
        });

        it('has the correct decimals', async function () {
            const decimals = await this.token.decimals();
            decimals.should.be.bignumber.eql(web3.utils.toBN(_decimals.toString()));
        });

        it('has the correct supply', async function () {
            const totalSupply = await this.token.totalSupply();
            totalSupply.should.be.bignumber.eql(web3.utils.toBN(_supply));
        });
    });
});
