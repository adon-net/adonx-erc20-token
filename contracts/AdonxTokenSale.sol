pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/crowdsale/Crowdsale.sol";
import "@openzeppelin/contracts/crowdsale/validation/PausableCrowdsale.sol";
import "@openzeppelin/contracts/crowdsale/validation/TimedCrowdsale.sol";
import "@openzeppelin/contracts/crowdsale/distribution/FinalizableCrowdsale.sol";

import "@openzeppelin/contracts/token/ERC20/TokenTimelock.sol";

contract AdonxTokenSale is
    Ownable,
    Crowdsale,
    PausableCrowdsale,
    TimedCrowdsale,
    FinalizableCrowdsale
{
    // Track investor contributions

    mapping(address => uint256) contributions;
    mapping(address => address[]) xWallets;

    uint256 private investorMinCap = 100000000000000000;

    // Token time lock
    uint256 private unlockTime;
    uint256 private changeableRate;

    uint256 private startTime;
    uint256 private endTime;

    constructor(
        uint256 _rate,
        address payable _wallet,
        ERC20 _token,
        uint256 _openingTime, // opening time in unix epoch seconds
        uint256 _closingTime, // closing time in unix epoch seconds
        uint256 _releaseTime // unlock time in unix epoch seconds
    )
        public
        Crowdsale(_rate, _wallet, _token)
        TimedCrowdsale(_openingTime, _closingTime)
    {
        require(_rate > 0);
        require(_wallet != address(0));
        require(
            _releaseTime > block.timestamp,
            "Unlock time should be > current time"
        );

        changeableRate = _rate;
        startTime = _openingTime;
        endTime = _closingTime;
        unlockTime = _releaseTime;
    }

    function setRate(uint256 newRate) public onlyOwner {
        changeableRate = newRate;
    }

    /**
     * @return the number of token units a buyer gets per wei.
     */
    function rate() public view returns (uint256) {
        return changeableRate;
    }

    function _getTokenAmount(uint256 weiAmount)
        internal
        view
        returns (uint256)
    {
        return weiAmount.mul(changeableRate);
    }

    function getLockedWallets(address _user)
        public
        view
        returns (address[] memory)
    {
        return xWallets[_user];
    }

    function getMinPurchaseCap() public view returns (uint256) {
        return investorMinCap;
    }

    function updateMinPurchaseCap(uint256 _newMinCap) public onlyOwner {
        require(_newMinCap != investorMinCap, "");
        investorMinCap = _newMinCap;
    }

    function tokenBalance() public view returns (uint256) {
        return super.token().balanceOf(address(this));
    }

    /**
     * @return the time when the tokens are released.
     */
    function getUnlockTime() public view returns (uint256) {
        return unlockTime;
    }

    function updateUnlockTime(uint256 _newReleaseTime) public onlyOwner {
        require(
            unlockTime != _newReleaseTime,
            "New unlock time should be differnt"
        );
        unlockTime = _newReleaseTime;
    }

    /**
     * @return the crowdsale opening time.
     */
    function openingTime() public view returns (uint256) {
        return startTime;
    }

    function updateOpeningTime(uint256 _newOpeningTime) public onlyOwner {
        require(
            startTime != _newOpeningTime,
            "New unlock time should be differnt"
        );
        startTime = _newOpeningTime;
    }

    /**
     * @return the crowdsale closing time.
     */
    function closingTime() public view returns (uint256) {
        return endTime;
    }

    function updateClosingTime(uint256 _newClosingTime) public onlyOwner {
        require(
            endTime != _newClosingTime,
            "New unlock time should be differnt"
        );
        endTime = _newClosingTime;
    }

    /**
     * @dev Returns the amount contributed so far by a sepecific user.
     * @param _beneficiary Address of contributor
     * @return User contribution so far
     */
    function getUserContribution(address _beneficiary)
        public
        view
        returns (uint256)
    {
        return contributions[_beneficiary];
    }

    function _preValidatePurchase(address _beneficiary, uint256 _weiAmount)
        internal
        view
    {
        super._preValidatePurchase(_beneficiary, _weiAmount);
        require(
            _weiAmount >= investorMinCap,
            "AdonxTokenSale: Amount is below minimum purchase requirement"
        );
    }

    function _processPurchase(address _beneficiary, uint256 _tokenAmount)
        internal
    {
        // uint256 _unlockTime = now + (unlockTimeInHrs * 1 hours);
        require(unlockTime > closingTime(), "Unlock time should be in future");

        address _xWallet =
            address(new TokenTimelock(super.token(), _beneficiary, unlockTime));
        xWallets[_beneficiary].push(_xWallet);

        if (msg.sender != _beneficiary) {
            xWallets[msg.sender].push(_xWallet);
        }

        emit xWalletCreated(
            _xWallet,
            msg.sender,
            _beneficiary,
            now,
            unlockTime,
            _tokenAmount
        );
        super._processPurchase(_xWallet, _tokenAmount);
    }

    function _updatePurchasingState(address _beneficiary, uint256 _weiAmount)
        internal
    {
        super._updatePurchasingState(_beneficiary, _weiAmount);
        uint256 _contribution = contributions[_beneficiary];
        contributions[_beneficiary] = _contribution.add(_weiAmount);
    }

    /**
     * @dev enables token transfers, called when owner calls finalize()
     */
    function finalization() public onlyOwner {
        uint256 remainingTokens = tokenBalance();
        if (remainingTokens > 0) {
            super.token().safeTransfer(super.wallet(), remainingTokens);
        }
        super._finalization();
    }

    event xWalletCreated(
        address xContract,
        address from,
        address to,
        uint256 createdAt,
        uint256 unlockDate,
        uint256 amount
    );
}
