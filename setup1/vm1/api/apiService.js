const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');


// Setting for Hyperledger Fabric
const { Wallets, Gateway } = require('fabric-network');
const { stringify } = require('querystring');

// const ccpPath = path.resolve(__dirname, '.',  'connection-org3.json');
const ccpPath = './config/connection-org2.yaml'
const userName = 'adminSaaq';
const walletPath = './identity/user/adminSaaq/wallet';
const port = 8082


const app = express();
app.use(bodyParser.json());

async function customizeTransaction(contract, fcn, ...args){
    //This function allow us to retrieve TXID and Result (It replace contract.submitTransaction)
    const transaction = contract.createTransaction(fcn);
    const result = await transaction.submit(...args);
    return {
        TxID : transaction.getTransactionId(),
        result: result.toString()
    }
}

console.log(`****API Service for SAAQ running on port ${port}****`)

app.post('/api/receive', async function (req, res) {
    try {

        //1. Connection Using Wallet and Access to the Gateway

        // 1.1. Loading of Wallet Identity
        // A wallet stores a collection of identities for use
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        //1.2. Check to see if we've already enrolled the user.
        // The user have to be created au prealable
        const identity = await wallet.get(userName);
        if (!identity) {
            console.log(`An identity for the user "${userName}" does not exist in the wallet`);
            console.log('Ask Admin to Run the EnrollUser application before retrying');
            return;
        }
        //1.3. Load info from connection-orgX.yaml (see ccpPath)
        let connectionProfile = yaml.safeLoad(fs.readFileSync(ccpPath, 'utf8'));
        
        //1.4 Set connection options; identity and wallet
        let connectionOptions = {
            identity: userName,
            wallet: wallet,
            discovery: { enabled:true, asLocalhost: true }
        };
        // Connect to gateway using application specified parameters
        console.log('****Connect to Fabric gateway.****');

        //1.5 Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(connectionProfile, connectionOptions);

        //2. Access PaperNet network
        console.log('****Use network channel: mychannel.****');

        //2.1 Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        //2.2. Get addressability to vdx paper contract
        console.log('Use org.copnet.vdxpaper smart contract.');
        const contract = network.getContract('papervdx');

        //3. SubmitTransaction
        //3.1  receive vdx paper
        console.log('Submit vdx paper receive transaction.');

        //receive transaction - requires 7 arguments, ex: ('receive', 'PC', '00001', 'SAAQ', 'SAAQ', '2022-11-21', 'Document received');
        let data = req.body
        const response = await customizeTransaction(contract, 'receive', 'PC', data.paperNumber, 'SAAQ',
        'SAAQ', data.receiveDateTime, data.comment);

        //3.2 process response
        console.log(`Process create transaction id. , TxID is: ${response.TxID}`);
        console.log(`Process create transaction response. , Result is: ${response.result}`);

        res.status(200).json({response});

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to process receive transaction: ${error}`);
        res.status(500).json({error: error});
        process.exit(1);
    }
});

app.post('/api/deliver', async function (req, res) {
    try {

        //1. Connection Using Wallet and Access to the Gateway

        // 1.1. Loading of Wallet Identity
        // A wallet stores a collection of identities for use
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        //1.2. Check to see if we've already enrolled the user.
        // The user have to be created au prealable
        const identity = await wallet.get(userName);
        if (!identity) {
            console.log(`An identity for the user "${userName}" does not exist in the wallet`);
            console.log('Ask Admin to Run the EnrollUser application before retrying');
            return;
        }
        //1.3. Load info from connection-orgX.yaml (see ccpPath)
        let connectionProfile = yaml.safeLoad(fs.readFileSync(ccpPath, 'utf8'));
        
        //1.4 Set connection options; identity and wallet
        let connectionOptions = {
            identity: userName,
            wallet: wallet,
            discovery: { enabled:true, asLocalhost: true }
        };
        // Connect to gateway using application specified parameters
        console.log('****Connect to Fabric gateway.****');

        //1.5 Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(connectionProfile, connectionOptions);

        //2. Access PaperNet network
        console.log('****Use network channel: mychannel.****');

        //2.1 Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        //2.2. Get addressability to vdx paper contract
        console.log('Use org.copnet.vdxpaper smart contract.');
        const contract = network.getContract('papervdx');

        //3. SubmitTransaction
        //3.1  deliver vdx paper
        console.log('Submit vdx paper deliver transaction.');

        //deliver transaction - requires 8 arguments, ex: ('deliver', 'PC', '00001', 'SAAQ', 'PC', '2022-11-21', '088383838', 'Document delivered');
        let data = req.body
        const response = await customizeTransaction(contract, 'deliver', 'PC', data.paperNumber, 'SAAQ', 
        'PC', data.deliverDateTime, data.fileNumber, data.docImma);

        //3.2 process response
        console.log(`Process create transaction id. , TxID is: ${response.TxID}`);
        console.log(`Process create transaction response. , Result is: ${response.result}`);

        res.status(200).json({response});

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to process deliver transaction: ${error}`);
        res.status(500).json({error: error});
        process.exit(1);
    }
});

app.post('/api/queryhistory', async function (req, res) {
    try {

        //1. Connection Using Wallet and Access to the Gateway

        // 1.1. Loading of Wallet Identity
        // A wallet stores a collection of identities for use
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        //1.2. Check to see if we've already enrolled the user.
        // The user have to be created au prealable
        const identity = await wallet.get(userName);
        if (!identity) {
            console.log(`An identity for the user "${userName}" does not exist in the wallet`);
            console.log('Ask Admin to Run the EnrollUser application before retrying');
            return;
        }
        //1.3. Load info from connection-orgX.yaml (see ccpPath)
        let connectionProfile = yaml.safeLoad(fs.readFileSync(ccpPath, 'utf8'));
        
        //1.4 Set connection options; identity and wallet
        let connectionOptions = {
            identity: userName,
            wallet: wallet,
            discovery: { enabled:true, asLocalhost: true }
        };
        // Connect to gateway using application specified parameters
        console.log('****Connect to Fabric gateway.****');

        //1.5 Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(connectionProfile, connectionOptions);

        //2. Access PaperNet network
        console.log('****Use network channel: mychannel.****');

        //2.1 Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        //2.2. Get addressability to vdx paper contract
        console.log('Use org.copnet.vdxpaper smart contract.');
        const contract = network.getContract('papervdx');
        
        // Evaluate the specified transaction.
        // queryHistory transaction - requires 2 argument, ex: ('queryHistory', 'PC', '00001')
        data = req.body
        console.log(`Query VDX Paper History of data ${data.paperNumber}`);
        const result = await contract.evaluateTransaction('queryHistory', 'PC', data.paperNumber);
        console.log(`Transaction History has been evaluated, result is: ${result.toString()}`);
        res.status(200).json({response: result.toString()});

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to evaluate transaction History: ${error}`);
        res.status(500).json({error: error});
        process.exit(1);
    }
});


app.listen(port);