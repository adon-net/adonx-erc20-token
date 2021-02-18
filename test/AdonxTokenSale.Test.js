const ether = require('../utils/ether.Helper');
const EVMRevert = require('../utils/EVMRevert.Helper');
const duration = require('../utils/duration.Helper');
const time = require('../utils/time.Helper')
const blocks = require('../utils/blocks.Helper');

const timeMachine = require('ganache-time-traveler');
const { expect } = require('chai');
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-datetime'))
  .should();

const AdonxToken = artifacts.require('AdonxToken');
const AdonxTokenSale = artifacts.require('AdonxTokenSale');


contract('AdonxTokenSale', function ([_, wallet, investor1, investor2, investor3, investor4]) {

  console.log("_owner                  # " + _);
  console.log("wallet                  # " + wallet);
  console.log("investor1               # " + investor1);
  console.log("investor2               # " + investor2);
  console.log("investor3               # " + investor3);
  console.log("investor4               # " + investor4);

  before(async function () {
    // Transfer extra ether to investor1's account for testing
    // await web3.eth.sendTransaction({ from: _, to: investor1, value: ether.toWei('25') })
    // await web3.eth.sendTransaction({ from: _, to: investor2, value: ether.toWei('10') })
  });

  beforeEach(async function () {
    // Token config
    this.name = "Adonx Token";
    this.symbol = "ADONX";
    this.decimals = 18;
    this.supply = ether.toWei('21000000');

    // Deploy Token
    this.token = await AdonxToken.new(this.name, this.symbol, this.decimals, this.supply);

    const block_number = await web3.eth.getBlockNumber();
    const block = await web3.eth.getBlock(block_number)
    this.latestBlockTime = block['timestamp'];

    // console.log(time.toDateTime(this.latestBlockTime));

    // Investor caps
    this.investorMinCap = ether.toWei('0.1');

    // Token Distribution Details
    this.tokensInPreICO = ether.toWei('550000');

    // this.preIcoStage      = 0;
    this.rateStage_1 = 5000;
    this.rateStage_2 = 3300;
    this.rateStage_3 = 2500;

    this.timeStamp = time.currentTimeStamp();

    // tokenSale config
    this.rate = this.rateStage_1;            // Tokens per ETH
    this.wallet = wallet;
    this.openingTime = this.latestBlockTime + duration.seconds(30);  // time.toTimeStamp(2021, 2, 15, 15, 0, 0);
    this.closingTime = this.openingTime + duration.weeks(6);         //time.toTimeStamp(2021, 3, 31, 15, 0, 0);

    this.tokenSale = await AdonxTokenSale.new(
      this.rate,
      this.wallet,
      this.token.address,
      this.openingTime,
      this.closingTime
    );

    await this.token.setTransferAgent(_, true);
    await this.token.setReleaseAgent(_);
    await this.token.setTransferAgent(this.tokenSale.address, true);

    let snapshot = await timeMachine.takeSnapshot();
    this.snapshotId = snapshot['result'];

  });

  afterEach(async function () {
    await timeMachine.revertToSnapshot(this.snapshotId);
  });

  describe('Token Attributes', function () {

    it('has the correct name', async function () {
      const name = await this.token.name();
      name.should.equal(this.name);
    });

    it('has correct symbol', async function () {
      const symbol = await this.token.symbol();
      symbol.should.equal(this.symbol);
    });

    it('has correct decimals', async function () {
      const decimals = await this.token.decimals();
      decimals.should.be.bignumber.eql(web3.utils.toBN(this.decimals.toString()));
    });

    it('has correct supply', async function () {
      const totalSupply = await this.token.totalSupply();
      totalSupply.should.be.bignumber.eql(web3.utils.toBN(this.supply.toString()));
    });

  });

  describe('Token Sale Attributes', function () {

    it('Has Correct Rate', async function () {
      const rate = await this.tokenSale.rate();
      rate.should.be.bignumber.eql(web3.utils.toBN(this.rate.toString()));
    });

    it('Has Correct Wallet', async function () {
      const wallet = await this.tokenSale.wallet();
      wallet.should.eql(this.wallet);
    });

    it('Only Admin Can Change Rate', async function () {
      await this.tokenSale.setRate(3500, { from: _ }).should.be.fulfilled;
      await this.tokenSale.setRate(3500, { from: investor1 }).should.be.rejectedWith(EVMRevert);
    });

    describe('Investor Min Cap', function () {

      it('only admin can change', async function () {
        await this.tokenSale.updateMinPurchaseCap(ether.toWei('0.5'), { from: _ }).should.be.fulfilled;
        await this.tokenSale.updateMinPurchaseCap(ether.toWei('0.5'), { from: investor1 }).should.be.rejectedWith(EVMRevert);
      });

      it('updated investor min cap should be ok', async function () {
        let _newCap = ether.toWei('0.5');
        let oldCap = await this.tokenSale.getMinPurchaseCap();
        oldCap = oldCap.toString();

        await this.tokenSale.updateMinPurchaseCap(_newCap);

        let newCap = await this.tokenSale.getMinPurchaseCap();
        newCap = newCap.toString();
        newCap.should.be.bignumber.eql(_newCap.toString());
      });

    });

    describe('Paused Sale', function () {
      beforeEach(async function () {
        await this.token.transfer(this.tokenSale.address, ether.toWei('550000'), { from: _ }).should.be.fulfilled;
        await timeMachine.advanceTime(duration.minutes(1));
      });
      it('only admin can pause the sale', async function () {
        this.tokenSale.pause({ from: investor1 }).should.be.rejectedWith(EVMRevert);
        this.tokenSale.pause({ from: _ }).should.be.fulfilled;
      });
      it('only admin can unpause the sale', async function () {
        this.tokenSale.pause({ from: _ }).should.be.fulfilled;
        this.tokenSale.unpause({ from: investor1 }).should.be.rejectedWith(EVMRevert);
        this.tokenSale.unpause({ from: _ }).should.be.fulfilled;
      });
      it('buyer can\'t buy when sale is paused', async function () {
        this.tokenSale.pause();
        await this.tokenSale.buyTokens(investor2, { value: ether.toWei('.5'), from: investor2 }).should.not.be.fulfilled;
        this.tokenSale.unpause();
        await this.tokenSale.buyTokens(investor2, { value: ether.toWei('.5'), from: investor2 }).should.be.fulfilled;
      });
    });

    describe('Timed Sale', function () {
      beforeEach(async function () {
        await this.token.transfer(this.tokenSale.address, ether.toWei('550000'), { from: _ }).should.be.fulfilled;
      });

      it('only admin can update opening time', async function () {
        var newOpeningTime = Math.floor((new Date).getTime() / 1000) + duration.hours(1);
        newOpeningTime = newOpeningTime.toString();
        this.tokenSale.updateOpeningTime(newOpeningTime, { from: investor1 }).should.be.rejectedWith(EVMRevert);
        this.tokenSale.updateOpeningTime(newOpeningTime, { from: _ }).should.be.fulfilled;
      });

      it('updated opening time should be ok', async function () {
        var oldOpeningTime = await this.tokenSale.openingTime();
        oldOpeningTime = oldOpeningTime.toString();

        var newOpeningTime = Math.floor((new Date).getTime() / 1000) + duration.hours(6);
        newOpeningTime = newOpeningTime.toString();

        this.tokenSale.updateOpeningTime(newOpeningTime, { from: _ }).should.be.fulfilled;

        updatedOpeningTime = await this.tokenSale.openingTime();
        updatedOpeningTime = updatedOpeningTime.toString();

        updatedOpeningTime.should.be.bignumber.eql(newOpeningTime.toString());
      });

      it('only admin can update closing time', async function () {
        var newClosingTime = Math.floor((new Date).getTime() / 1000) + duration.hours(1);
        newClosingTime = newClosingTime.toString();
        this.tokenSale.updateOpeningTime(newClosingTime, { from: investor1 }).should.be.rejectedWith(EVMRevert);
        this.tokenSale.updateOpeningTime(newClosingTime, { from: _ }).should.be.fulfilled;
      });

      it('updated closing time should be ok', async function () {
        var oldClosingTime = await this.tokenSale.openingTime();
        oldClosingTime = oldClosingTime.toString();

        var newClosingTime = Math.floor((new Date).getTime() / 1000) + duration.hours(6);
        newClosingTime = newClosingTime.toString();

        this.tokenSale.updateOpeningTime(newClosingTime, { from: _ }).should.be.fulfilled;

        updatedClosingTime = await this.tokenSale.openingTime();
        updatedClosingTime = updatedClosingTime.toString();

        updatedClosingTime.should.be.bignumber.eql(newClosingTime.toString());
      });

      it('buyer can\'t buy when sale is not started', async function () {
        await this.tokenSale.buyTokens(investor2, { value: ether.toWei('.5'), from: investor2 }).should.not.be.fulfilled;
        await timeMachine.advanceTime(duration.minutes(1));
        await this.tokenSale.buyTokens(investor2, { value: ether.toWei('.5'), from: investor2 }).should.be.fulfilled;
      });

      it('buyer can\'t buy when sale is closed', async function () {
        await timeMachine.advanceTime(duration.minutes(1));
        await this.tokenSale.buyTokens(investor2, { value: ether.toWei('.5'), from: investor2 }).should.be.fulfilled;
        await timeMachine.advanceTime(duration.weeks(8));
        await this.tokenSale.buyTokens(investor2, { value: ether.toWei('.5'), from: investor2 }).should.not.be.fulfilled;
      });
    });

    describe('Token Transfer Restrictions', function () {
      beforeEach(async function () {
        await this.token.transfer(this.tokenSale.address, ether.toWei('550000'), { from: _ }).should.be.fulfilled;
        await timeMachine.advanceTime(duration.minutes(1));
      });

      it('buyer should be able to buy', async function () {
        await this.tokenSale.buyTokens(investor1, { value: ether.toWei('.5'), from: investor1 }).should.be.fulfilled;
        await this.tokenSale.buyTokens(investor1, { value: ether.toWei('.5'), from: investor2 }).should.be.fulfilled;

        var token_bal_investor1 = await this.token.balanceOf(investor1);
        token_bal_investor1 = ether.fromWei(token_bal_investor1.toString());
        token_bal_investor1.should.be.bignumber.eql(web3.utils.toBN('5000'));
      });

      it('buyer should be able to buy on behalf of friend', async function () {
        await this.tokenSale.buyTokens(investor1, { value: ether.toWei('.5'), from: investor2 }).should.be.fulfilled;

        var token_bal_investor1 = await this.token.balanceOf(investor1);
        token_bal_investor1 = ether.fromWei(token_bal_investor1.toString());
        token_bal_investor1.should.be.bignumber.eql(web3.utils.toBN('2500'));
      });

      it('buyer can\'t transfer tokens when transfer lock', async function () {
        await this.tokenSale.buyTokens(investor1, { value: ether.toWei('.5'), from: investor1 }).should.be.fulfilled;

        var token_bal_investor1 = await this.token.balanceOf(investor1);
        token_bal_investor1 = ether.fromWei(token_bal_investor1.toString());
        token_bal_investor1.should.be.bignumber.eql(web3.utils.toBN('2500'));

        await this.token.transfer(investor2, ether.toWei('500'), { from: investor1 }).should.not.be.fulfilled;
      });

      it('only approved user can transfer tokens when transfer lock', async function () {
        await this.tokenSale.buyTokens(investor1, { value: ether.toWei('.5'), from: investor1 }).should.be.fulfilled;
        await this.token.setTransferAgent(investor1, true, { from: _ }).should.be.fulfilled;
        await this.token.transfer(investor2, ether.toWei('250'), { from: investor1}).should.be.fulfilled;
      });

      it('everyone should be able to transfer tokens after transefer lock release', async function () {
        await this.tokenSale.buyTokens(investor1, { value: ether.toWei('.5'), from: investor1 }).should.be.fulfilled;
        await this.tokenSale.buyTokens(investor2, { value: ether.toWei('.5'), from: investor2 }).should.be.fulfilled;
        await this.tokenSale.buyTokens(investor3, { value: ether.toWei('.5'), from: investor3 }).should.be.fulfilled;

        var token_bal_investor1 = await this.token.balanceOf(investor1);
        token_bal_investor1 = ether.fromWei(token_bal_investor1.toString());
        token_bal_investor1.should.be.bignumber.eql(web3.utils.toBN('2500'));

        var token_bal_investor2 = await this.token.balanceOf(investor2);
        token_bal_investor2 = ether.fromWei(token_bal_investor2.toString());
        token_bal_investor2.should.be.bignumber.eql(web3.utils.toBN('2500'));

        var token_bal_investor3 = await this.token.balanceOf(investor3);
        token_bal_investor3 = ether.fromWei(token_bal_investor3.toString());
        token_bal_investor3.should.be.bignumber.eql(web3.utils.toBN('2500'));

        await this.token.transfer(investor1, ether.toWei('500'), { from: investor2 }).should.not.be.fulfilled;
        await this.token.transfer(investor2, ether.toWei('500'), { from: investor3 }).should.not.be.fulfilled;
        await this.token.transfer(investor3, ether.toWei('500'), { from: investor1 }).should.not.be.fulfilled;

        await this.token.releaseTokenTransfer({ from: _ });

        await this.token.transfer(investor4, ether.toWei('500'), { from: investor1 }).should.be.fulfilled;
        await this.token.transfer(investor4, ether.toWei('500'), { from: investor2 }).should.be.fulfilled;
        await this.token.transfer(investor4, ether.toWei('500'), { from: investor3 }).should.be.fulfilled;

        var token_bal_investor4 = await this.token.balanceOf(investor4);
        token_bal_investor4 = ether.fromWei(token_bal_investor4.toString());
        token_bal_investor4.should.be.bignumber.eql(web3.utils.toBN('1500'));
      });

      it('only admin can release transfer lock', async function () {
        await this.token.releaseTokenTransfer({ from: _ }).should.be.fulfilled;
      });

      it('normal users can\'t release transfer lock', async function () {
        await this.token.releaseTokenTransfer({ from: investor2 }).should.not.be.fulfilled;
      });

      it('only admin can set transfer agent', async function () {
        await this.tokenSale.buyTokens(investor3, { value: ether.toWei('.5'), from: investor3 }).should.be.fulfilled;
        await this.token.setTransferAgent(investor3, true, { from: _ }).should.be.fulfilled;

        await this.token.transfer(investor4, ether.toWei('500'), { from: investor3 }).should.be.fulfilled;
        var token_bal_investor4 = await this.token.balanceOf(investor4);
        token_bal_investor4 = ether.fromWei(token_bal_investor4.toString());
        token_bal_investor4.should.be.bignumber.eql(web3.utils.toBN('500'));
      });

      it('only admin can revoke transfer agent', async function () {
        await this.token.setTransferAgent(investor3, false, { from: _ }).should.be.fulfilled;
        await this.token.transfer(investor4, ether.toWei('500'), { from: investor3 }).should.not.be.fulfilled;
      });

      it('normal users can\'t set transfer agent', async function () {
        await this.token.setTransferAgent(investor3, true, { from: investor2 }).should.not.be.fulfilled;
      });

      it('only admin can set release agent', async function () {
        await this.token.setReleaseAgent(investor3, { from: _ }).should.be.fulfilled;
      });

      it('normal users can\'t set release agent', async function () {
        await this.token.setReleaseAgent(investor3, { from: investor2 }).should.not.be.fulfilled;
      });
    });
  });

  describe('Perform Token Sale', function () {
    beforeEach(async function () {
      await this.token.transfer(this.tokenSale.address, ether.toWei('550000'), { from: _ }).should.be.fulfilled;
      await timeMachine.advanceTime(duration.minutes(1));
    });

    it('Buyer can not buy more than token balance', async function () {

      await this.tokenSale.buyTokens(investor1, { value: ether.toWei('120'), from: investor1 }).should.not.be.fulfilled;

    });

    it('Token puchase after updated rate should be ok', async function () {
      let oldRate = await this.tokenSale.rate();
      oldRate = oldRate.toString();

      _newRate = 3500;
      await this.tokenSale.setRate(_newRate);

      let newRate = await this.tokenSale.rate();
      newRate = newRate.toString();
      newRate.should.be.bignumber.eql(_newRate.toString());

      let saleBalance = await this.token.balanceOf(this.tokenSale.address);
      saleBalance = ether.fromWei(saleBalance.toString());

      await this.tokenSale.buyTokens(investor1, { value: ether.toWei('1'), from: investor1 }).should.be.fulfilled;

      let investor1_balance = await this.token.balanceOf(investor1);
      investor1_balance = ether.fromWei(investor1_balance.toString());
      investor1_balance.should.be.bignumber.eql(web3.utils.toBN(_newRate.toString()));
    });

    it('Buyer can\'t buy with below investor cap', async function () {
      await this.tokenSale.buyTokens(investor2, { value: ether.toWei('.09'), from: investor2 }).should.not.be.fulfilled;
    });

    it('Buyer contribution details should match', async function () {
      await this.tokenSale.buyTokens(investor1, { value: ether.toWei('1'), from: investor1 }).should.be.fulfilled;
      await this.tokenSale.buyTokens(investor1, { value: ether.toWei('1.5'), from: investor1 }).should.be.fulfilled;
      await this.tokenSale.buyTokens(investor1, { value: ether.toWei('2.5'), from: investor1 }).should.be.fulfilled;
      await this.tokenSale.buyTokens(investor1, { value: ether.toWei('10'), from: investor1 }).should.be.fulfilled;

      let investor1_contribution = await this.tokenSale.getUserContribution(investor1);
      investor1_contribution = investor1_contribution.toString();
      investor1_contribution.should.be.bignumber.eql(ether.toWei('15').toString());

      await this.tokenSale.buyTokens(investor2, { value: ether.toWei('0.5'), from: investor2 }).should.be.fulfilled;
      await this.tokenSale.buyTokens(investor2, { value: ether.toWei('1.5'), from: investor2 }).should.be.fulfilled;
      await this.tokenSale.buyTokens(investor2, { value: ether.toWei('2.5'), from: investor2 }).should.be.fulfilled;
      await this.tokenSale.buyTokens(investor2, { value: ether.toWei('0.4'), from: investor2 }).should.be.fulfilled;

      let investor2_contribution = await this.tokenSale.getUserContribution(investor2);
      investor2_contribution = investor2_contribution.toString();
      investor2_contribution.should.be.bignumber.eql(ether.toWei('4.9').toString());
    });

    describe('Buyer gifts his friend ( buy on behalf of )', function () {
      beforeEach(async function () {
        this.beneficiary = investor3;
        this.buyer = investor4;
        await this.token.transfer(this.tokenSale.address, ether.toWei('550000'), { from: _ }).should.be.fulfilled;
        await this.tokenSale.buyTokens(this.beneficiary, { value: ether.toWei('1'), from: this.buyer }).should.be.fulfilled;
      });

      it('benficiary balance should be ok', async function () {
        let beneficiary_balance = await this.token.balanceOf(this.beneficiary);
        beneficiary_balance = web3.utils.fromWei(beneficiary_balance, 'ether').toString();
        beneficiary_balance.should.be.bignumber.eql(this.rate.toString());
      });
    });

    describe('Buyer actual wallet on purchase tokens', function () {
      it('balance should be 5000', async function () {
        await this.tokenSale.buyTokens(investor1, { value: ether.toWei('1'), from: investor1 }).should.be.fulfilled;
        var balance = await this.token.balanceOf(investor1);
        balance = ether.fromWei(balance.toString());
        balance.should.be.bignumber.eql(web3.utils.toBN('5000'));
      });
    });
  });

  describe('Finalize Token Sale', function () {
    beforeEach(async function () {
      this.saleAmount = '550000';
      await this.token.transfer(this.tokenSale.address, ether.toWei(this.saleAmount), { from: _ }).should.be.fulfilled;
      await timeMachine.advanceTime(duration.minutes(1));
    });

    it('finalization should be ok', async function () {
      let oldRate = await this.tokenSale.rate();
      oldRate = oldRate.toString();

      _newRate = 3500;
      await this.tokenSale.setRate(_newRate);

      let newRate = await this.tokenSale.rate();
      newRate = newRate.toString();
      newRate.should.be.bignumber.eql(_newRate.toString());

      let saleBalance = await this.token.balanceOf(this.tokenSale.address);
      saleBalance = ether.fromWei(saleBalance.toString());

      saleBalance.should.be.bignumber.eql(web3.utils.toBN(this.saleAmount.toString()));

      await this.tokenSale.buyTokens(investor1, { value: ether.toWei('1'), from: investor1 }).should.be.fulfilled;

      let investor1_balance = await this.token.balanceOf(investor1);
      investor1_balance = ether.fromWei(investor1_balance.toString());
      investor1_balance.should.be.bignumber.eql(web3.utils.toBN(_newRate.toString()));

      await timeMachine.advanceTime(duration.weeks(7));

      let afterSaleBalance = '546500';
      saleBalance = await this.token.balanceOf(this.tokenSale.address);
      saleBalance = ether.fromWei(saleBalance.toString());
      saleBalance.should.be.bignumber.eql(web3.utils.toBN(afterSaleBalance.toString()));

      this.tokenSale.finalization();

      let walletTokenBalance = await this.token.balanceOf(this.wallet);
      walletTokenBalance = ether.fromWei(walletTokenBalance.toString());
      walletTokenBalance.should.be.bignumber.eql(web3.utils.toBN(afterSaleBalance.toString()));

      let walletEthBalance = await web3.eth.getBalance(this.wallet);
      walletEthBalance = ether.fromWei(walletEthBalance.toString());
      // console.log('--' + walletEthBalance);
      // let ethBalance = '1';
      // walletEthBalance.should.be.bignumber.gte(web3.utils.toBN(ethBalance.toString()));

    });
  });
});