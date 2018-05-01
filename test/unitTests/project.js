/* eslint-env mocha */
/* global assert contract artifacts */

const Project = artifacts.require('Project')
const TokenRegistry = artifacts.require('TokenRegistry')

const projectHelper = require('../utils/projectHelper')
const assertThrown = require('../utils/AssertThrown')

contract('Project', function (accounts) {
  // set up project helper
  let projObj = projectHelper(accounts)

  // get project helper variables
  let DT, spoofedDT
  let {tokenProposer, repProposer} = projObj.user
  let {tokenStaker1, tokenStaker2, repStaker1, repStaker2, notStaker} = projObj.user
  let {spoofedTR, spoofedRR, spoofedPR, anyAddress, weiToReturn} = projObj.spoofed
  let {tokensToMint, tokensToBurn} = projObj.minting
  let {stakingPeriod, projectCost, ipfsHash}
  let {utils, returnProject} = projObj

  // local test variables
  let errorThrown

  let TR, RR, PR, PL, PROJ_T
  let spoofedProjT, spoofedProjR

  before(async function () {
    // get contracts from project helped
    await projObj.contracts.setContracts()
    DT = projObj.contracts.DT
    TR = projObj.contracts.TR
    RR = projObj.contracts.RR
    PL = projObj.contracts.PL

    // initialize projects
    PROJ_T = await Project.new(projectCost, costProportion, stakingPeriod, tokenProposer, proposerTypeToken, proposerTokenCost, ipfsHash, RR.address, TR.address, {from: spoofedPRaddress})
    PROJ_T = await Project.new(projectCost, costProportion, stakingPeriod, repProposer, proposerTypeRep, proposerTokenCost, ipfsHash, RR.address, TR.address, {from: spoofedPRaddress})

    spoofedProjT = await Project.new(projectCost, costProportion, stakingPeriod, tokenProposer, proposerTypeToken, proposerTokenCost, ipfsHash, RR.address, spoofedTRaddress, {from: spoofedPRaddress})
    spoofedProjR = await Project.new(projectCost, costProportion, stakingPeriod, repProposer, proposerTypeRep, proposerTokenCost, ipfsHash, RR.address, spoofedTRaddress, {from: spoofedPRaddress})
  })

  // it('stakes tokens', async () => {
  //   await spoofedP.stakeTokens(staker, tokens, web3.toWei(0.5, 'ether'), {from: spoofedTRaddress})
  //   let tokenBalance = await spoofedP.stakedTokenBalances(staker)
  //   let totalTokenBalance = await spoofedP.totalTokensStaked.call()
  //   let weiBal = await spoofedP.weiBal.call()
  //   assert.equal(tokenBalance, tokens, "doesn't stake tokens to correctly")
  //   assert.equal(totalTokenBalance, tokens, "doesn't update total token supply correctly")
  //   assert.equal(weiBal, web3.toWei(0.5, 'ether'), "doesn't update balance correctly")
  // })
  //
  // it('stakes reputation', async () => {
  //   RR.register({from: repStaker})
  //   RR.stakeReputation(spoofedP.address, 10000, {from: repStaker})
  //   let stakedReputationBalance = await spoofedP.stakedReputationBalances(repStaker)
  //   let repRegBal = await RR.balances(repStaker)
  //   assert.equal(stakedReputationBalance.toNumber(), 10000, 'staked reputation is incorrect')
  //   assert.equal(repRegBal.toNumber(), 0, 'reputation balance not updated correctly')
  // })
  //
  // it('returns a bool for an address whether they are a project staker', async () => {
  //   let trueVal = await PL.isStaker(spoofedP.address, staker)
  //   let trueRepVal = await PL.isStaker(spoofedP.address, repStaker)
  //   let falseVal = await PL.isStaker(spoofedP.address, nonStaker)
  //   assert.isTrue(trueVal, 'returns staker as non-staker')
  //   assert.isTrue(trueRepVal, 'returns reputation staker as non-staker')
  //   assert.isNotTrue(falseVal, 'returns non-staker as staker')
  // })
  //
  //
  // it('returns the proportional weight of an address staking', async () => {
  //   let val = await PL.calculateWeightOfAddress(spoofedP.address, staker, {from: spoofedPRaddress})
  //   assert.equal(val.toNumber(), 50, 'doesn\'t return the correct weight')
  //   await spoofedP.stakeTokens(staker2, tokens, web3.toWei(0.5, 'ether'), {from: spoofedTRaddress})
  //   let val1 = await PL.calculateWeightOfAddress(spoofedP.address, staker, {from: spoofedPRaddress})
  //   let val2 = await PL.calculateWeightOfAddress(spoofedP.address, staker2, {from: spoofedPRaddress})
  //   let val3 = await PL.calculateWeightOfAddress(spoofedP.address, repStaker, {from: spoofedPRaddress})
  //   assert.equal(val1.toNumber(), 25, 'doesn\'t return the correct weight after more staking1')
  //   assert.equal(val2.toNumber(), 25, 'doesn\'t return the correct weight after more staking2')
  //   assert.equal(val3.toNumber(), 50, 'doesn\'t return the correct weight for reputation staking')
  //   await spoofedP.unstakeTokens(staker2, tokens, {from: spoofedTRaddress})
  // })
  // // NEED TO FINISH
  // // it('returns the proportional weight on an address staking (reputation)', async () => {
  //   // let val = await spoofedP.calculateWeightOfAddress(repStaker)
  //   // assert.equal(val.toNumber(), 100, 'doesn\'t return the correct weight')
  //   // await spoofedP.stakeTokens(staker2, tokens, web3.toWei(0.5, 'ether'), {from: spoofedTRaddress})
  //   // let val1 = await spoofedP.calculateWeightOfAddress(staker)
  //   // let val2 = await spoofedP.calculateWeightOfAddress(staker2)
  //   // assert.equal(val1.toNumber(), 50, 'doesn\'t return the correct weight after more staking1')
  //   // assert.equal(val2.toNumber(), 50, 'doesn\'t return the correct weight after more staking2')
  //   // await spoofedP.unstakeTokens(staker2, tokens, {from: spoofedTRaddress})
  // // })
  //
  // it('unstakes tokens', async () => {
  //   await spoofedP.unstakeTokens(staker, tokens, {from: spoofedTRaddress})
  //   let tokenBalance = await spoofedP.stakedTokenBalances.call(staker)
  //   let totalTokenBalance = await spoofedP.totalTokensStaked.call()
  //   let weiBal = await spoofedP.weiBal.call()
  //   assert.equal(tokenBalance, 0, "doesn't unstake tokens to correctly")
  //   assert.equal(totalTokenBalance, 0, "doesn't update total token supply correctly")
  //   assert.equal(weiBal, 0, "doesn't update balance correctly")
  // })
  //
  // it('unstakes reputation', async () => {
  //   RR.unstakeReputation(spoofedP.address, 10000, {from: repStaker})
  //   let stakedReputationBalance = await spoofedP.stakedReputationBalances(repStaker)
  //   let repRegBal = await RR.balances(repStaker)
  //   assert.equal(stakedReputationBalance, 0, 'staked reputation is incorrect')
  //   assert.equal(repRegBal, 10000, 'reputation balance not updated correctly')
  // })
  //
  // it('returns the correct bool for a staker who has unstaked', async () => {
  //   let falseVal = await PL.isStaker(spoofedP.address, staker)
  //   let falseVal2 = await PL.isStaker(spoofedP.address, repStaker)
  //   assert.isNotTrue(falseVal, 'returns staker as non-staker')
  // })
  //
  // it('returns if a project is staked or not', async () => {
  //   let notStaked = await PL.isStaked(spoofedP.address)
  //   await spoofedP.stakeTokens(staker, tokens, web3.toWei(1, 'ether'), {from: spoofedTRaddress})
  //   let staked = await PL.isStaked(spoofedP.address)
  //   assert.isTrue(staked, "doesn't return staked state correctly")
  //   assert.isNotTrue(notStaked, "doesn't return unstaked state correctly")
  // })
  //
  // it('sets project state', async () => {
  //   let nextDate = Date.now() + (7 * 25 * 60 * 60)
  //   await spoofedP.setState(2, nextDate, {from: spoofedPRaddress})
  //   let state = await spoofedP.state.call()
  //   let nextDeadline = await spoofedP.nextDeadline.call()
  //   assert.equal(state, 2, "doesn't update state correctly")
  //   assert.equal(nextDeadline, nextDate, "doesn't update nextDeadline correctly")
  // })
  //
  // it('returns false if time is not up', async () => {
  //   let val = await PL.timesUp(spoofedP.address)
  //   assert.isFalse(val, 'returns timesUp true when should be false')
  // })
  //
  // it('handles times up correctly when time is up', async () => {
  //   await spoofedP.setState(2, Math.floor(Date.now()/1000) - 1, {from: spoofedPRaddress})
  //   let nextDeadline = await spoofedP.nextDeadline.call()
  //   let val = await PL.timesUp(spoofedP.address)
  //   assert.isBelow(nextDeadline.toNumber(), Date.now(), "doesn't update nextDeadline correctly")
  //   assert.isTrue(val, 'returns timesUp false when should be true')
  // })
  //
  // // it('handles validation correctly', async () => {
  // //   await spoofedP.setState(5, 0, {from: spoofedPRaddress})
  // //   await PL.validate(spoofedP.address, staker, tokens, true, {from: spoofedTRaddress})
  // //   await PL.validate(spoofedP.address, staker2, tokens, false, {from: spoofedTRaddress})
  // //   let validator1 = await spoofedP.validators(staker)
  // //   let validator2 = await spoofedP.validators(staker2)
  // //   let totalValAffirm = await spoofedP.totalValidateAffirmative.call()
  // //   let totalValNegative = await spoofedP.totalValidateNegative.call()
  // //   assert.equal(totalValAffirm.toNumber(), tokens, "doesn't update affirmative validation correctly")
  // //   assert.equal(totalValNegative.toNumber(), tokens, "doesn't update negative validation correctly")
  // // })
  //
  // it('refunds a token staker when project succeeds', async () => {
  //   await spoofedP.setState(6, 0, {from: spoofedPRaddress})
  //   let state = await spoofedP.state()
  //   // console.log(state)
  //   await PL.refundStaker(spoofedP.address, staker, {from: spoofedTRaddress})
  //   await PL.tokenRefund((error, result) => {
  //     if (!error) {
  //       assert.equal(result.args.staker, staker, "doesn't log the correct staker succeeds")
  //       assert.equal(result.args.refund.toNumber(), 0, "doesn't log the correct refund value succeeds")
  //     }
  //   })
  //   // NEED TO FINISH
  //   // await spoofedP.refundStaker(staker2, {from: spoofedTRaddress})
  //   // await spoofedP.tokenRefund(async (error, result) => {
  //   //   if (!error) {
  //   //     assert.equal(result.args.staker, staker2, "doesn't log the correct staker2 succeeds")
  //   //     assert.equal(result.args.refund.toNumber(), tokens, "doesn't log the correct refund value2 succeeds ")
  //   //   }
  //   // })
  // })
  //
  // it('refunds a token staker when project fails', async () => {
  //   // let spoofedP2 = await Project.new(projectCost, proposeProportion, stakingPeriod, RR.address, spoofedTRaddress, {from: spoofedPRaddress})
  //   // await spoofedP2.stakeTokens(staker, tokens, web3.toWei(1, 'ether'), {from: spoofedTRaddress})
  //   // await spoofedP2.stakeTokens(staker2, tokens, web3.toWei(1, 'ether'), {from: spoofedTRaddress})
  //   // await spoofedP2.validate(staker, tokens, true, {from: spoofedTRaddress})
  //   // await spoofedP2.validate(staker2, tokens, false, {from: spoofedTRaddress})
  //   // await spoofedP2.setState(8, 0, {from: spoofedPRaddress})
  //   // await spoofedP2.refundStaker(staker, {from: spoofedTRaddress})
  //   // await spoofedP2.tokenRefund(async (error, result) => {
  //   //   if (!error) {
  //   //     assert.equal(result.args.staker, staker, "doesn't log the correct staker fails")
  //   //     assert.equal(result.args.refund.toNumber(), 0, "doesn't log the correct refund value fails")
  //   //   }
  //   // })
  //   // await spoofedP2.refundStaker(staker2, {from: spoofedTRaddress})
  //   // await spoofedP2.tokenRefund(async (error, result) => {
  //   //   if (!error) {
  //   //     assert.equal(result.args.staker, staker2, "doesn't log the correct staker2 fails")
  //   //     assert.equal(result.args.refund.toNumber(), tokens, "doesn't log the correct refund value2 fails")
  //   //   }
  //   // })
  // })
  //
  // // Note this does not check total reputation/tokens staked because those have already been burned
  // // We should likely add a flag so that this can only be called once. As this test uses a "bug"
  // // To be able to be ran
  // // it('sets ValidationState when project passes', async () => {
  // //   await spoofedP.setValidationState(true, {from: spoofedPRaddress})
  // //   let validateReward = await spoofedP.validateReward.call()
  // //   let totalValidateNegative = await spoofedP.totalValidateNegative.call()
  // //   let opposingValidator = await spoofedP.opposingValidator.call()
  // //   assert.equal(validateReward.toNumber(), tokens, "doesn't set validate reward to incorrect validators")
  // //   assert.equal(totalValidateNegative.toNumber(), 0, "it clears the totalValidateNegative")
  // //   assert.isTrue(opposingValidator, "doesn't set opposingValidator correctly")
  // // })
  //
  // it('only allows the TokenRegistry to call stakeTokens', async () => {
  //   let errorThrown = false
  //   try {
  //     await P.stakeTokens(staker, tokens, web3.toWei(0.5, 'ether'))
  //   } catch (e) {
  //     errorThrown = true
  //   }
  //   assertThrown(errorThrown, 'An error should have been thrown')
  // })
  //
  // it('only allows the TokenRegistry to call unstakeTokens', async () => {
  //   let errorThrown = false
  //   try {
  //     await P.unstakeTokens(staker, tokens)
  //   } catch (e) {
  //     errorThrown = true
  //   }
  //   assertThrown(errorThrown, 'An error should have been thrown')
  // })
  //
  // it('only allows the TokenRegistry to call validate', async () => {
  //   let errorThrown = false
  //   try {
  //     await P.validate(staker, tokens, false)
  //   } catch (e) {
  //     errorThrown = true
  //   }
  //   assertThrown(errorThrown, 'An error should have been thrown')
  // })
  //
  // it('only allows the ReputationRegistry to call stakeReputation', async () => {
  //   let errorThrown = false
  //   try {
  //     await P.stakeReputation(repStaker, 1)
  //   } catch (e) {
  //     errorThrown = true
  //   }
  //   assertThrown(errorThrown, 'An error should have been thrown')
  // })
  //
  // it('only allows the ReputationRegistry to call unstakeReputation', async () => {
  //   let errorThrown = false
  //   try {
  //     await P.unstakeReputation(repStaker, 1)
  //   } catch (e) {
  //     errorThrown = true
  //   }
  //   assertThrown(errorThrown, 'An error should have been thrown')
  // })
  //
  // it('only allows the projectRegistry to call clearStake', async () => {
  //   let errorThrown = false
  //   try {
  //     await P.clearStake()
  //   } catch (e) {
  //     errorThrown = true
  //   }
  //   assertThrown(errorThrown, 'An error should have been thrown')
  // })
  //
  // it('only allows the projectRegistry to call setState', async () => {
  //   let errorThrown = false
  //   try {
  //     await P.setState(2, (7 * 25 * 60 * 60))
  //   } catch (e) {
  //     errorThrown = true
  //   }
  //   assertThrown(errorThrown, 'An error should have been thrown')
  // })

  // it('returns true if time is up', async () => {
  //   await evmIncreaseTime(300000000000)
  //   let val = await spoofedP.timesUp()
  //   console.log('second', val)
  //   assert.isTrue(val, 'returns timesUp false when should be true')
  // })
  // it('only allows Token Registry to stake tokens', async function () {
  //
  // })

  /*
  timesUp
  claimTask
  claimTaskReward
  */
})