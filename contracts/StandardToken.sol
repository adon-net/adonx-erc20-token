pragma solidity ^0.5.0;


import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract StandardToken is ERC20, Ownable {
    /* The finalizer contract that allows unlift the transfer limits on this token */
    address public releaseAgent;

    /** A crowdsale contract can release us to the wild if ICO success. If false we are are in transfer lock up period.*/
    bool public released = true;

    /** Map of agents that are allowed to transfer tokens regardless of the lock down period. These are crowdsale contracts and possible the team multisig itself. */
    mapping(address => bool) public transferAgents;

    constructor(
    ) public {
      transferAgents[msg.sender] = true;
    }

    /**
     * Limit token transfer until the crowdsale is over.
     *
     */
    modifier canTransfer(address _sender) {
        require(released || transferAgents[_sender]);
        _;
    }

    /**
     * Set the contract that can call release and make the token transferable.
     *
     * Design choice. Allow reset the release agent to fix fat finger mistakes.
     */
    function setReleaseAgent(address addr)
        public
        onlyOwner
        inReleaseState(false)
    {
        // We don't do interface check here as we might want to a normal wallet address to act as a release agent
        releaseAgent = addr;
    }

    /**
     * Owner can allow a particular address (a crowdsale contract) to transfer tokens despite the lock up period.
     */
    function setTransferAgent(address addr, bool state)
        public
        onlyOwner
        inReleaseState(false)
    {
        transferAgents[addr] = state;
    }

    /**
     * One way function to release the tokens to the wild.
     *
     * Can be called only from the release agent that is the final ICO contract. It is only called if the crowdsale has been success (first milestone reached).
     */
    function releaseTokenTransfer() public onlyReleaseAgent {
        released = true;
    }

    /** The function can be called only before or after the tokens have been releasesd */
    modifier inReleaseState(bool releaseState) {
        require(releaseState == released, "");
        _;
    }

    /** The function can be called only by a whitelisted release agent. */
    modifier onlyReleaseAgent() {
        require(msg.sender == releaseAgent, "");
        _;
    }

    function transfer(address _to, uint256 _value)
        public
        canTransfer(msg.sender)
        returns (bool success)
    {
        return super.transfer(_to, _value);
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public canTransfer(_from) returns (bool success) {
        return super.transferFrom(_from, _to, _value);
    }
}
