/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Fabric smart contract classes
const { Contract, Context } = require('fabric-contract-api');

// CopNet specifc classes
const VdxPaper = require('./paper.js');
const PaperList = require('./paperlist.js');
const QueryUtils = require('./queries.js');

/**
 * A custom context provides easy access to list of all vdx papers
 */
class VdxPaperContext extends Context {

    constructor() {
        super();
        // All papers are held in a list of papers
        this.paperList = new PaperList(this);
    }

}

/**
 * Define vdx paper smart contract by extending Fabric Contract class
 *
 */
class VdxPaperContract extends Contract {

    constructor() {
        // Unique namespace when multiple contracts per chaincode file
        super('org.copnet.vdxpaper');
    }

    /**
     * Define a custom context for vdx paper
    */
    createContext() {
        return new VdxPaperContext();
    }

    /**
     * Instantiate to perform any setup of the ledger that might be required.
     * @param {Context} ctx the transaction context
     */
    async instantiate(ctx) {
        // No implementation required with this example
        // It could be where data migration is performed, if necessary
        console.log('Instantiate the contract');
    }

    /**
     * Create vdx paper
     *
     * @param {Context} ctx the transaction context
     * @param {String} issuer vdx paper issuer
     * @param {Integer} paperNumber paper number for this issuer
     * @param {String} createDateTime paper create date
     * @param {String} docHash paper hash linked // transaction input - not written to asset
     * @param {String} nid identification number of issuer
     * @param {String} nvh number of vehicle
     * @param {String} fullname Fullname of Issuer
     * @param {String} nas Assurance
     * @param {String} lines lines of paper
    */
    async create(ctx, issuer, paperNumber, createDateTime, nid, nvh, fullname, nas, lines, docHash) {

        // create an instance of the paper
        let paper = VdxPaper.createInstance(issuer, paperNumber, createDateTime, nid, nvh, fullname, nas, lines);

        // Smart contract, rather than paper, moves paper into CREATED state
        paper.setCreated();

        // save the issuer's MSP 
        let mspid = ctx.clientIdentity.getMSPID();
        paper.setIssuerMSP(mspid);

        // Newly created paper is operated by the issuer to begin with (recorded for reporting purposes)
        paper.setOperator(issuer);
        paper.setOperatorMSP(mspid);

        // Add the paper to the list of all similar vdx papers in the ledger world state
        await ctx.paperList.addPaper(paper);

        // Must return a serialized paper to caller of smart contract
        return paper;
    }

    /**
     * Issue vdx paper
     *
     * @param {Context} ctx the transaction context
     * @param {String} issuer vdx paper issuer
     * @param {Integer} paperNumber paper number for this issuer
     * @param {String} issueDateTime paper issue date
     * @param {String} currentOperator current operator of paper
     * @param {String} newOperator new operator of paper
     * @param {String} docHash paper hash linked // transaction input - not written to asset
    */
    async issue(ctx, issuer, paperNumber, issueDateTime, currentOperator, newOperator) {

        // Retrieve the current paper using key fields provided
        let paperKey = VdxPaper.makeKey([issuer, paperNumber]);
        let paper = await ctx.paperList.getPaper(paperKey);

        // Validate current operator (Current Operator is the old one)
        if (paper.getOperator() !== currentOperator) {
            throw new Error('\nPaper ' + issuer + paperNumber + ' is not operated by ' + currentOperator);
        }

        // First check transactions moves state from CREATED to ISSUED 
        if (paper.isCreated()) {
            paper.setIssued();
        }

        // Check paper is not already ISSUED or another forward state level
        if (paper.isIssued()) {
            paper.setOperator(newOperator);
            // save the operator's MSP 
            let opMspid = ctx.clientIdentity.getMSPID();
            paper.setOperatorMSP(opMspid);
            paper.issueDateTime = issueDateTime;
        } else {
            throw new Error('\nPaper ' + issuer + paperNumber + ' is not checked. Current state = ' + paper.getCurrentState());
        }

        // Update the paper
        await ctx.paperList.updatePaper(paper);
        return paper;
    }


    /**
     * Check vdx paper
     *
      * @param {Context} ctx the transaction context
      * @param {String} issuer vdx paper issuer
      * @param {Integer} paperNumber paper number for this issuer
      * @param {String} currentOperator current operator of paper
      * @param {String} newOperator new operator of paper
      * @param {String} checkDateTime time paper was checked  // transaction input - not written to asset
      * @param {String} comment A bit comment if needed  // transaction input - not written to asset
     */
    async check(ctx, issuer, paperNumber, currentOperator, newOperator, checkDateTime, comment) {

        // Retrieve the current paper using key fields provided
        let paperKey = VdxPaper.makeKey([issuer, paperNumber]);
        let paper = await ctx.paperList.getPaper(paperKey);

        // Validate current operator
        if (paper.getOperator() !== currentOperator) {
            throw new Error('\nPaper ' + issuer + paperNumber + ' is not operated by ' + currentOperator);
        }

        // First check transactions moves state from ISSUED to CHECKED 
        if (paper.isIssued()) {
            paper.setChecked();
        }

        // Check paper is not already TREATED or another forward state level
        if (paper.isChecked()) {
            paper.setOperator(newOperator);
            // save the operator's MSP 
            let opMspid = ctx.clientIdentity.getMSPID();
            paper.setOperatorMSP(opMspid);
        } else {
            throw new Error('\nPaper ' + issuer + paperNumber + ' is not checked. Current state = ' + paper.getCurrentState());
        }

        // Update the paper
        await ctx.paperList.updatePaper(paper);
        return paper;
    }

    /**
     * Treat vdx paper
     *
      * @param {Context} ctx the transaction context
      * @param {String} issuer vdx paper issuer
      * @param {Integer} paperNumber paper number for this issuer
      * @param {String} currentOperator current operator of paper
      * @param {String} newOperator new operator of paper
      * @param {String} treatDateTime time paper was treated  // transaction input - not written to asset
      * @param {String} docHash paper hash linked // transaction input - not written to asset
      * @param {Number} vat face value of paper // transaction input - not written to asset
     */
    async treat(ctx, issuer, paperNumber, currentOperator, newOperator, treatDateTime, docHash, vat) {

        // Retrieve the current paper using key fields provided
        let paperKey = VdxPaper.makeKey([issuer, paperNumber]);
        let paper = await ctx.paperList.getPaper(paperKey);

        // Validate current operator
        if (paper.getOperator() !== currentOperator) {
            throw new Error('\nPaper ' + issuer + paperNumber + ' is not operated by ' + currentOperator);
        }
        // First check transactions moves state from CHECKED to TREATED
        if (paper.isChecked()) {
            paper.setTreated();
        }

        // Check paper is not already PAID or another forward state level
        if (paper.isTreated()) {
            paper.setOperator(newOperator);
            // save the operator's MSP 
            let opMspid = ctx.clientIdentity.getMSPID();
            paper.setOperatorMSP(opMspid);
            paper.vat = parseFloat(vat);
        } else {
            throw new Error('\nPaper ' + issuer + paperNumber + ' is not treated. Current state = ' + paper.getCurrentState());
        }

        // Update the paper
        await ctx.paperList.updatePaper(paper);
        return paper;
    }

    /**
     * Paid vdx paper
     *
      * @param {Context} ctx the transaction context
      * @param {String} issuer vdx paper issuer
      * @param {Integer} paperNumber paper number for this issuer
      * @param {String} currentOperator current operator of paper
      * @param {String} newOperator new operator of paper
      * @param {String} payDateTime time paper was paid  // transaction input - not written to asset
      * @param {String} docHash proof of payment doc hash linked // transaction input - not written to asset
      * @param {String} reference payment reference // transaction input - not written to asset
     */
    async pay(ctx, issuer, paperNumber, currentOperator, newOperator, payDateTime, docHash, reference) {

        // Retrieve the current paper using key fields provided
        let paperKey = VdxPaper.makeKey([issuer, paperNumber]);
        let paper = await ctx.paperList.getPaper(paperKey);

        //Validation more strict
        // Validate current issuer's MSP in the paper === invoking Payer's MSP id - can only transfer if you are the owning org.
        if (paper.getIssuerMSP() !== ctx.clientIdentity.getMSPID()) {
            throw new Error('\nPaper ' + issuer + paperNumber + ' is not owned by the current invoking Organisation, and not authorised to paid');
        }

        // First check transactions moves state from TREATED to PAID
        if (paper.isTreated()) {
            paper.setPaid();
        }

        // Check paper is not already RECEIVED or another forward state level
        if (paper.isPaid()) {
            paper.setOperator(newOperator);
            // save the operator's MSP 
            let opMspid = ctx.clientIdentity.getMSPID();
            paper.setOperatorMSP(opMspid);
        } else {
            throw new Error('\nPaper ' + issuer + paperNumber + ' is not treated. Current state = ' + paper.getCurrentState());
        }

        // Update the paper
        await ctx.paperList.updatePaper(paper);
        return paper;
    }

    /**
     * Received vdx paper
     *
      * @param {Context} ctx the transaction context
      * @param {String} issuer vdx paper issuer
      * @param {Integer} paperNumber paper number for this issuer
      * @param {String} currentOperator current operator of paper
      * @param {String} newOperator new operator of paper
      * @param {String} receiveDateTime time paper was received  // transaction input - not written to asset
      * @param {String} comment A bit comment if needed  // transaction input - not written to asset
     */
    async receive(ctx, issuer, paperNumber, currentOperator, newOperator, receiveDateTime, comment) {

        // Retrieve the current paper using key fields provided
        let paperKey = VdxPaper.makeKey([issuer, paperNumber]);
        let paper = await ctx.paperList.getPaper(paperKey);

        // Validate current operator
        if (paper.getOperator() !== currentOperator) {
            throw new Error('\nPaper ' + issuer + paperNumber + ' is not operated by ' + currentOperator);
        }

        // First check transactions moves state from PAID to RECEIVED 
        if (paper.isPaid()) {
            paper.setReceived();
        }

        // Check paper is not already DELIVERED or another state level
        if (paper.isReceived()) {
            paper.setOperator(newOperator);
            // save the operator's MSP 
            let opMspid = ctx.clientIdentity.getMSPID();
            paper.setOperatorMSP(opMspid);
        } else {
            throw new Error('\nPaper ' + issuer + paperNumber + ' is not received. Current state = ' + paper.getCurrentState());
        }

        // Update the paper
        await ctx.paperList.updatePaper(paper);
        return paper;
    }

    /**
     * Deliver vdx paper
     *
      * @param {Context} ctx the transaction context
      * @param {String} issuer vdx paper issuer
      * @param {Integer} paperNumber paper number for this issuer
      * @param {String} currentOperator current operator of paper
      * @param {String} newOperator new operator of paper
      * @param {String} deliverDateTime time paper was delivered  // transaction input - not written to asset
      * @param {String} docImma paper certificate immatriculation hash linked // transaction input - not written to asset
     */
    async deliver(ctx, issuer, paperNumber, currentOperator, newOperator, deliverDateTime, fileNumber, docImma) {

        // Retrieve the current paper using key fields provided
        let paperKey = VdxPaper.makeKey([issuer, paperNumber]);
        let paper = await ctx.paperList.getPaper(paperKey);

        // Validate current operator
        if (paper.getOperator() !== currentOperator) {
            throw new Error('\nPaper ' + issuer + paperNumber + ' is not operated by ' + currentOperator);
        }

        // Check paper is not alread in a state of DELIVERED
        if (paper.isDelivered()) {
            throw new Error('\nPaper ' + issuer + paperNumber + ' has already been delivered');
        }
        // First check transactions moves state from RECEIVED to DELIVERED
        if (paper.isReceived()) {
            paper.setDelivered();
        }

        // Check paper is on anoter wrong state level
        if (paper.isDelivered()) {
            paper.setOperator(newOperator);
            // save the operator's MSP 
            let opMspid = ctx.clientIdentity.getMSPID();
            paper.setOperatorMSP(opMspid);
            paper.fileNumber = fileNumber
            paper.deliverDateTime = deliverDateTime; // record delivering date against the asset (the complement to 'issue date')
            paper.docImma = docImma; // record the hash of the final doc Immatriculation delivered
        } else {
            throw new Error('\nPaper ' + issuer + paperNumber + ' is not delivered. Current state = ' + paper.getCurrentState());
        }

        // Update the paper
        await ctx.paperList.updatePaper(paper);
        return paper;
    }    

    // Query transactions

    /**
     * Query history of a vdx paper
     * @param {Context} ctx the transaction context
     * @param {String} issuer vdx paper issuer
     * @param {Integer} paperNumber paper number for this issuer
    */
    async queryHistory(ctx, issuer, paperNumber) {

        // Get a key to be used for History query

        let query = new QueryUtils(ctx, 'org.copnet.paper');
        let results = await query.getAssetHistory(issuer, paperNumber); // (cpKey);
        return results;

    }

    /**
    * queryOperator vdx paper: supply name of operating org, to find list of papers based on operator field
    * @param {Context} ctx the transaction context
    * @param {String} operator vdx paper operator
    */
    async queryOperator(ctx, operator) {

        let query = new QueryUtils(ctx, 'org.copnet.paper');
        let operator_results = await query.queryKeyByOperator(operator);

        return operator_results;
    }

    /**
    * queryPartial vdx paper - provide a prefix eg. "RQ" will list all papers _issued_ by RQ etc etc
    * @param {Context} ctx the transaction context
    * @param {String} prefix asset class prefix (added to paperlist namespace) eg. org.copnet.paperRQ asset listing: papers issued by RQ.
    */
    async queryPartial(ctx, prefix) {

        let query = new QueryUtils(ctx, 'org.copnet.paper');
        let partial_results = await query.queryKeyByPartial(prefix);

        return partial_results;
    }

    /**
    * queryAdHoc vdx paper - supply a custom mango query
    * eg - as supplied as a param:     
    * ex1:  ["{\"selector\":{\"vat\":{\"$lt\":100}}}"]
    * ex2:  ["{\"selector\":{\"vat\":{\"$gt\":500000}}}"]
    * 
    * @param {Context} ctx the transaction context
    * @param {String} queryString querystring
    */
    async queryAdhoc(ctx, queryString) {

        let query = new QueryUtils(ctx, 'org.copnet.paper');
        let querySelector = JSON.parse(queryString);
        let adhoc_results = await query.queryByAdhoc(querySelector);

        return adhoc_results;
    }


    /**
     * queryNamed - supply named query - 'case' statement chooses selector to build (pre-canned for demo purposes)
     * @param {Context} ctx the transaction context
     * @param {String} queryname the 'named' query (built here) - or - the adHoc query string, provided as a parameter
     */
    async queryNamed(ctx, queryname) {
        let querySelector = {};
        switch (queryname) {
            case "delivered":
                querySelector = { "selector": { "currentState": 6 } };  // 6 = delivered state
                break;
            case "received":
                querySelector = { "selector": { "currentState": 5 } };  // 5 = received state
                break;
            case "paid":
                querySelector = { "selector": { "currentState": 4 } };  // 4 = paid state
                break;
            case "treated":
                querySelector = { "selector": { "currentState": 3 } };  // 3 = treated state
                break;
            case "checked":
                querySelector = { "selector": { "currentState": 2 } };  // 2 = checked state
                break;
            case "issued":
                querySelector = { "selector": { "currentState": 1 } };  // 1 = issued state
                break;
            case "value":
                // may change to provide as a param - fixed value for now in this sample
                querySelector = { "selector": { "vat": { "$gt": 1000 } } };  // to test, issue CommPapers with vat <= or => this figure.
                break;
            default: // else, unknown named query
                throw new Error('invalid named query supplied: ' + queryname + '- please try again ');
        }

        let query = new QueryUtils(ctx, 'org.copnet.paper');
        let adhoc_results = await query.queryByAdhoc(querySelector);

        return adhoc_results;
    }

}

module.exports = VdxPaperContract;
