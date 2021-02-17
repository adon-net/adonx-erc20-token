const AdonxToken  = artifacts.require("./AdonxToken.sol");

module.exports = async function(deployer, network, accounts) {

  const _name     = "Adonx";
  const _symbol   = "ADONX";
  const _decimals = 18;
  const _supply   = '21000000000000000000000000';

  await deployer.deploy(
    AdonxToken,
    _name,
    _symbol,
    _decimals,
    _supply
  );
};
