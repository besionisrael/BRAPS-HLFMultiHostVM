/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Utility class for ledger state
const State = require('./../ledger-api/state.js');

// Enumerate vdx paper state values
const cpState = {
    CREATED: 1,
    ISSUED: 2,
    CHECKED: 3,
    TREATED: 4,
    PAID: 5,
    RECEIVED: 6,
    DELIVERED: 7
};

/**
 * VdxPaper class extends State class
 * Class will be used by application and smart contract to define a paper
 */
class VdxPaper extends State {

    constructor(obj) {
        super(VdxPaper.getClass(), [obj.issuer, obj.paperNumber]);
        Object.assign(this, obj);
    }

    /**
     * Basic getters and setters
    */
    getIssuer() {
        return this.issuer;
    }

    setIssuer(newIssuer) {
        this.issuer = newIssuer;
    }

    getIssuerMSP() {
        return this.mspid;
    }

    setIssuerMSP(mspid) {
        this.mspid = mspid;
    }

    getOperator() {
        return this.operator;
    }

    getOperatorMSP() {
        return this.opMspid;
    }

    setOperatorMSP(opMspid) {
        this.opMspid = opMspid;
    }

    setOperator(newOperator) {
        this.operator = newOperator;
    }

    /**
     * Useful methods to encapsulate vdx paper states
     */
     setCreated() {
        this.currentState = cpState.CREATED;
    }

    setIssued() {
        this.currentState = cpState.ISSUED;
    }

    setChecked() {
        this.currentState = cpState.CHECKED;
    }

    setTreated() {
        this.currentState = cpState.TREATED;
    }

    setPaid() {
        this.currentState = cpState.PAID;
    }

    setReceived() {
        this.currentState = cpState.RECEIVED;
    }

    setDelivered() {
        this.currentState = cpState.DELIVERED;
    }

    isCreated() {
        return this.currentState === cpState.CREATED;
    }

    isIssued() {
        return this.currentState === cpState.ISSUED;
    }

    isChecked() {
        return this.currentState === cpState.CHECKED;
    }

    isTreated() {
        return this.currentState === cpState.TREATED;
    }

    isPaid() {
        return this.currentState === cpState.PAID;
    }

    isReceived() {
        return this.currentState === cpState.RECEIVED;
    }

    isDelivered() {
        return this.currentState === cpState.DELIVERED;
    }

    static fromBuffer(buffer) {
        return VdxPaper.deserialize(buffer);
    }

    toBuffer() {
        return Buffer.from(JSON.stringify(this));
    }

    getCurrentState(){
        return Object.keys(cpState).find(key => cpState[key] === value);
    }

    /**
     * Deserialize a state data to vdx paper
     * @param {Buffer} data to form back into the object
     */
    static deserialize(data) {
        return State.deserializeClass(data, VdxPaper);
    }

    /**
     * Factory method to create a vdx paper object
     */
    static createInstance(issuer, paperNumber, createDateTime, nid, nvh, fullname, nas, lines) {
        return new VdxPaper({ issuer, paperNumber, createDateTime, nid, nvh, fullname, nas, lines });
    }

    static getClass() {
        return 'org.copnet.vdxpaper';
    }
}

module.exports = VdxPaper;
