//'use strict';

const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;

class Evoting {

  constructor(cardName, namespace) {
    this.evotingNetworkConnection = new BusinessNetworkConnection();
    this.cardName = cardName;//'PDFCreator@certificate-network';
    this.namespace = namespace;//'org.university.certification';
  }

  async setupNetworkDefninition() {
    await this.evotingNetworkConnection.connect(this.cardName).then(result => {
      console.log("CONNECTED TO BLOCKCHAIN");
      this.evotingNetwork = result;
    }).catch(err => {
      console.log("ERROR DURING INIT", err);
    });
  }

  async getId() {
    await this.evotingNetworkConnection.ping().then(res => {
      console.log("EVOTING PARTI RES", res)
      this.id = res.participant.split('#').pop();
    }).catch(err => {
      console.log('pinging failed ', err);
    });
  }

  async init() {
    await this.setupNetworkDefninition();
    await this.getId();
  }

  async createElectionTransaction(items) {
    //get the factory for the business network.
    let factory = this.evotingNetworkConnection.getBusinessNetwork().getFactory();

    //create transaction
    const createElection = factory.newTransaction(this.namespace, 'createElection');

    createElection.creator = factory.newRelationship(this.namespace, 'Person', this.id);
    createElection.items = items;
    console.log("MY ID ", this.id);

   // console.log(createElection);
    //submit transaction
    await this.evotingNetworkConnection.submitTransaction(createElection).then((out) => {
      console.log("output from createelect", out);
       return true;
     }).catch((err) => {
       console.log('Error submitting create election transaction', err);
     });
  }
}

let elect = new Evoting('admin@evoting-network', 'org.evoting');
elect.init().then(() => {

  elect.createElectionTransaction(["hello world"]);
});

module.exports = Evoting;