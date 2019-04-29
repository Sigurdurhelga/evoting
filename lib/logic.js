/*
  helper method for deterministicially generating unique ids for items on the blockchain
*/
function uuid() {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`
}

const orgNamespace = 'org.evoting'

/**
 * @param {org.evoting.vote} vote - the vote tx
 * @transaction
 */
async function vote(vote) {

  let proposal = vote.proposal
  let voter = vote.voter

  if (voter.alreadyVoted.includes(proposal.proposalId)) {
    throw new Error("Already voted on this proposal.")
  }

  var time_elapsed = (Date.now() - proposal.creationDate) / 1000

  if (time_elapsed > 30) {
    throw new Error("Proposal has timed out.")
  }

  proposal.voteCount += 1
  voter.alreadyVoted.push(proposal.proposalId)

  const personRegistry = await getAssetRegistry(orgNamespace + '.Person')
  await personRegistry.update(voter)

  const proposalRegistry = await getAssetRegistry(orgNamespace + '.Proposal')
  await proposalRegistry.update(proposal)
}

/**
 * create a new election
 * @param {org.evoting.createElection} createElection - the createElection tx
 * @transaction
 */

async function createElection(createElection) {
  const registry = await getAssetRegistry(orgNamespace + '.Election')
  const factory = getFactory()

  // Create the election to be made, giving it a UUID for an identificaiton
  let newElection = factory.newResource(orgNamespace, 'Election', uuid())
  newElection.ballots = []
  let date = new Date()

  // For each of the districts in the 
  await getAllDistricts().then((districts) => {
    districts.forEach((district) => {
      // Setting up a ballot for each district
      let newBallot = factory.newResource(orgNamespace, 'Ballot', uuid())
      newBallot.chairperson = createElection.creator
      newBallot.votingDistrict = district

      // Add an individual proposal for each candidate in each ballot
      newBallot.proposals = []

      createElection.items.forEach((item) => {
        let newProposal = factory.newResource(orgNamespace, 'Proposal', uuid())
        newProposal.description = item
        newProposal.voteCount = 0
        newProposal.creationDate = date
        newBallot.proposals.push(newProposal)
      })
      newElection.ballots.push(newBallot)
    })
  })
  await registry.add(newElection)


}

/**
 * getAllDistricts
 * --------------------------------------------------------
 * queries the blockchain for all the district participants
 * and returns them as a list
 */
function getAllDistricts() {
  return getParticipantRegistry(orgNamespace + '.District')
    .then((participantRegistry) => {
      return participantRegistry.getAll();
    })
    .then((districts) => {
      return districts
    })
    .catch((error) => {
      // Add optional error handling here.
      console.log("Something went wrong", error)
      throw new Error("Getting all districts failed.")
    });
}