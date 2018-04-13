const TokenRegistry = artifacts.require('TokenRegistry')
const ReputationRegistry = artifacts.require('ReputationRegistry')
const DistributeToken = artifacts.require('DistributeToken')
const ProjectRegistry = artifacts.require('ProjectRegistry')
const ProjectLibrary = artifacts.require('ProjectLibrary')
const Project = artifacts.require('Project')

const evmIncreaseTime = require('./evmIncreaseTime')

module.exports = function projectHelper (web3, accounts) {
  let obj = {}
  obj.user = {}
  obj.minting = {}
  obj.reputation = {}
  obj.project = {}
  obj.contracts = {}
  obj.returnProject = {}

  // set up user identities
  // accounts[0] - no identity, default user for non-specified contract calls
  // accounts[1] - tokens
  // accounts[2] - both
  // accounts[3] - tokens
  // accounts[4] - rep
  // accounts[5] - rep
  // accounts[6] - rep
  // accounts[7] - rep
  // accounts[8] - nothing

  obj.user.tokenProposer = accounts[1]
  obj.user.repProposer = accounts[2]
  obj.user.notProposer = accounts[8]

  obj.user.tokenStaker1 = accounts[2]
  obj.user.tokenStaker2 = accounts[3]
  obj.user.repStaker1 = accounts[4]
  obj.user.repStaker2 = accounts[5]
  obj.user.notStaker = accounts[8]

  obj.user.worker1 = accounts[6]
  obj.user.worker2 = accounts[7]
  obj.user.notWorker = accounts[8]

  obj.user.validator1 = accounts[1]
  obj.user.validator2 = accounts[2]
  obj.user.notValidator = accounts[8]

  obj.user.repVoter = accounts[4]
  obj.user.tokenVoter = accounts[3]
  obj.user.notVoter = accounts[8]

  obj.user.notProject = accounts[8]

  // mutable minting details for each user
  obj.minting.tokensToMint = 10000

  // immutable registration reputation amount
  obj.reputation.registeredRep = 10000

  // mutable project details
  obj.project.now = new Date().getTime() / 1000                             // in seconds
  obj.project.stakingPeriod = Math.floor(obj.project.now + 604800)          // blockchain understands seconds                    // one week from now
  obj.project.expiredStakingPeriod = 10                                     // January 1st, 1970
  obj.project.projectCost = parseInt(web3.toWei(0.5, 'ether'))
  obj.project.ipfsHash = 'ipfsHashlalalalalalalalalalalalalalalalalalala'   // length == 46
  obj.project.incorrectIpfsHash = 'whyiseveryspokeleadawhiteman'            // length != 46

  // immutable project details
  obj.project.proposeProportion = 20
  obj.project.proposeReward = 100

  // contracts
  TokenRegistry.deployed().then(instance => obj.contracts.TR = instance)
  .then(() =>
    ReputationRegistry.deployed()).then(instance => { obj.contracts.RR = instance; return true })
    .then(() =>
      DistributeToken.deployed()).then(instance => obj.contracts.DT = instance)
      .then(() =>
        ProjectRegistry.deployed()).then(instance => obj.contracts.PR = instance)
        .then(() =>
          ProjectLibrary.deployed()).then(instance => obj.contracts.PL = instance)

  // helper functions
  obj.mint = async function (_user, _numTokens) {
    if (_numTokens === undefined) {                // use default minting amount
      _numTokens = obj.minting.tokensToMint
    }
    let mintingCost = await obj.contracts.DT.weiRequired(_numTokens, {from: _user})
    await obj.contracts.DT.mint(_numTokens, {from: _user, value: mintingCost})
  }

  obj.register = async function (_user) {
    let bal = await obj.contracts.RR.balances(_user)
    let first = await obj.contracts.RR.first(_user)
    if (bal.toNumber() === 0 && first === false) {
      await obj.contracts.RR.register({from: _user})
    }
  }

  // getters
  obj.getRepHolders = async function () {
    let repHolders = await obj.contracts.RR.totalUsers()
    return repHolders.toNumber()
  }

  obj.getTokenBalance = async function (_user) {
    let bal = await obj.contracts.DT.balanceOf(_user)
    return bal.toNumber()
  }

  obj.getRepBalance = async function (_user) {
    let bal = await obj.contracts.RR.balances(_user)
    return bal.toNumber()
  }

  obj.getTotalTokens = async function () {
    let total = await obj.contracts.DT.totalSupply()
    return total.toNumber()
  }

  obj.getTotalRep = async function () {
    let total = await obj.contracts.RR.totalSupply()
    return total.toNumber()
  }

  obj.getWeiPoolBal = async function () {
    let weiBal = await obj.contracts.DT.weiBal()
    return weiBal.toNumber()
  }

  obj.getCurrentPrice = async function () {
    let currPrice = await obj.contracts.DT.currentPrice()
    return currPrice.toNumber()
  }

  obj.project.getWeiCost = async function (_projAddr) {
    let PROJ = await Project.at(_projAddr)
    let weiCost = await PROJ.weiCost()
    return weiCost.toNumber()
  }

  obj.project.getWeiBal = async function (_projAddr) {
    let PROJ = await Project.at(_projAddr)
    let weiBal = await PROJ.weiBal()
    return weiBal.toNumber()
  }

  obj.project.getWeiRemaining = async function (_projAddr) {
    let weiCost = await obj.project.getWeiCost(_projAddr)
    let weiBal = await obj.project.getWeiBal(_projAddr)
    return weiCost - weiBal
  }

  obj.project.calculateRequiredTokens = async function (_projAddr) {
    let weiRemaining = await obj.project.getWeiRemaining(_projAddr)
    let currentPrice = await obj.getCurrentPrice()
    let requiredTokens = Math.ceil(weiRemaining / currentPrice)
    return requiredTokens.toNumber()
  }

  obj.project.getStakedTokens = async function (_projAddr) {
    let PROJ = await Project.at(_projAddr)
    let stakedTokens = await PROJ.tokensStaked()
    return stakedTokens.toNumber()
  }

  obj.project.getStakedRep = async function (_projAddr) {
    let PROJ = await Project.at(_projAddr)
    let stakedRep = await PROJ.reputationStaked()
    return stakedRep.toNumber()
  }

  obj.project.getUserStakedTokens = async function (_user, _projAddr) {
    let PROJ = await Project.at(_projAddr)
    let stakedTokens = await PROJ.tokenBalances(_user)
    return stakedTokens.toNumber()
  }

  obj.project.getUserStakedRep = async function (_user, _projAddr) {
    let PROJ = await Project.at(_projAddr)
    let stakedRep = await PROJ.reputationBalances(_user)
    return stakedRep.toNumber()
  }

  // project return functions
  // return project (address) proposed by token holder
  obj.returnProject.proposed_T = async function (_cost, _stakingPeriod, _ipfsHash) {

    // input parameter checks
    if (_cost === undefined) {
      _cost = obj.project.projectCost             // use default project cost
    }
    if (_stakingPeriod === undefined) {
      _stakingPeriod = obj.project.stakingPeriod  // use default staking period
    }
    if (_ipfsHash === undefined) {
      _ipfsHash = obj.project.ipfsHash            // use default staking period
    }

    // ensure proposer has enough tokens
    let currentPrice = await obj.getCurrentPrice()
    let proposerTokenCost = Math.floor(Math.floor(_cost / currentPrice) / obj.project.proposeProportion)
    let tBal = await obj.getTokenBalance(obj.user.tokenProposer)
    if (tBal < proposerTokenCost) {
      await obj.mint(obj.user.tokenProposer, proposerTokenCost - tBal)
    }

    // ensure someone has registered for reputation
    // reputation proposer is ordinary reputation holder in this case
    // await obj.register(obj.user.repProposer)

    // propose project
    let tx = await obj.contracts.TR.proposeProject(_cost, _stakingPeriod, _ipfsHash, {from: obj.user.tokenProposer})
    let log = tx.logs[0].args
    return log.projectAddress.toString()         // return project address
  }

  // return project (address) proposed by reputation holder
  obj.returnProject.proposed_R = async function (_cost, _stakingPeriod, _ipfsHash) {

    // input parameter checks
    if (_cost === undefined) {
      _cost = obj.project.projectCost             // use default project cost
    }
    if (_stakingPeriod === undefined) {
      _stakingPeriod = obj.project.stakingPeriod  // use default staking period
    }
    if (_ipfsHash === undefined) {
      _ipfsHash = obj.project.ipfsHash            // use default staking period
    }

    // ensure proposer has reputation
    await obj.register(obj.user.repProposer)

    // ensure someone has minted tokens -- not necessary, but realistic
    // token proposer is ordinary token holder in this case
    await obj.mint(obj.user.tokenProposer)

    // propose project
    let tx = await obj.contracts.RR.proposeProject(_cost, _stakingPeriod, _ipfsHash, {from: obj.user.repProposer})
    let log = tx.logs[0].args
    return log.projectAddress.toString()
  }

  // return project (address) proposed by token holder and staked by 2 of each
  obj.returnProject.staked_TR = async function (_cost, _stakingPeriod, _ipfsHash) {
    let projAddr = await obj.returnProject.proposed_T(_cost, _stakingPeriod, _ipfsHash)
  }

  // return project (address) proposed by reputation holder and staked by 2 of each
  obj.returnProject.staked_RT = async function (_cost, _stakingPeriod, _ipfsHash) {
    let projAddr = await obj.returnProject.proposed_T(_cost, _stakingPeriod, _ipfsHash)
  }

  return obj
}
