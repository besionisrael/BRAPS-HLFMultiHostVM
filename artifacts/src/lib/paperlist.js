/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Utility class for collections of ledger states --  a state list
const StateList = require('./../ledger-api/statelist.js');

const VdxPaper = require('./paper.js');

class PaperList extends StateList {

    constructor(ctx) {
        super(ctx, 'org.copnet.paper');
        this.use(VdxPaper);
    }

    async addPaper(paper) {
        return this.addState(paper);
    }

    async getPaper(paperKey) {
        return this.getState(paperKey);
    }

    async updatePaper(paper) {
        return this.updateState(paper);
    }
}


module.exports = PaperList;
