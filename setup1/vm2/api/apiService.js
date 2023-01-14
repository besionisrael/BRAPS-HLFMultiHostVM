const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
// Setting for Hyperledger Fabric
const { Wallets, Gateway } = require('fabric-network');

// const ccpPath = path.resolve(__dirname, '.',  'connection-org3.json');
const ccpPath = './config/connection-org1.yaml'
const userName = 'adminRq';
const walletPath = './identity/user/adminRq/wallet';
const port = 8081

const app = express();
app.use(bodyParser.json());
console.log(`****API Service for RQ running on port ${port}****`)

async function customizeTransaction(contract, fcn, ...args){
    //This function allow us to retrieve TXID and Result (It replace contract.submitTransaction)
    const transaction = contract.createTransaction(fcn);
    const result = await transaction.submit(...args);
    return {
        TxID : transaction.getTransactionId(),
        result: result.toString()
    }
}


app.post('/api/check', async function (req, res) {
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
        //3.1  check vdx paper
        console.log('Submit vdx paper check transaction.');

        //check transaction - requires 7 argument, ex: ('check', 'PC', '00001', 'RQ', 'RQ', '2022-11-21', "Document sent to Private WKF");
        let data = req.body
        const response = await customizeTransaction(contract, 'check', 'PC', data.paperNumber, 'RQ',
        'RQ', data.checkDateTime, data.comment);

        //3.2 process response
        console.log(`Process create transaction id. , TxID is: ${response.TxID}`);
        console.log(`Process create transaction response. , Result is: ${response.result}`);

        res.status(200).json({response});

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to process check transaction: ${error}`);
        res.status(500).json({error: error});
        process.exit(1);
    }
});

app.post('/api/treat', async function (req, res) {
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
        //3.1  treat vdx paper
        console.log('Submit vdx paper treat transaction.');

        //treat transaction - requires 8 arguments, ex: ('treat', 'PC', '00001', 'RQ', 'PC', '2022-11-21', "", "5000");
        let data = req.body
        const response = await customizeTransaction(contract, 'treat', 'PC', data.paperNumber, 'RQ', 
        'PC', data.treatDateTime, data.docHash, data.vat);

        //3.2 process response
        console.log(`Process create transaction id. , TxID is: ${response.TxID}`);
        console.log(`Process create transaction response. , Result is: ${response.result}`);

        res.status(200).json({response});

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to process treat transaction: ${error}`);
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


app.post('/api/queryOperator', async function (req, res) {
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
        // queryOperator transaction - requires 2 argument, ex: ('queryOperator', 'RQ')
        data = req.body
        console.log(`Query ransaction Operator for ${data.operator}`);
        const result = await contract.evaluateTransaction('queryOperator', data.operator);
        console.log(`Transaction Operator has been evaluated, result is: ${result.toString()}`);
        res.status(200).json({response: result.toString()});

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to evaluate transaction Operator: ${error}`);
        res.status(500).json({error: error});
        process.exit(1);
    }
});


app.post('/api/queryIssuer', async function (req, res) {
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
        // queryOperator transaction - requires 2 argument, ex: ('queryPartial', 'RQ')
        data = req.body
        console.log(`Query Transaction Partial Key Used as Issuer for ${data.issuer}`);
        const result = await contract.evaluateTransaction('queryPartial', data.issuer);
        console.log(`Transaction Partial Key Issuer has been evaluated, result is: ${result.toString()}`);
        res.status(200).json({response: result.toString()});

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to evaluate transaction Partial Key Issuer: ${error}`);
        res.status(500).json({error: error});
        process.exit(1);
    }
});

app.post('/api/queryNamed', async function (req, res) {
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
        // queryOperator transaction - requires 2 argument, ex: ('queryPartial', 'RQ')
        data = req.body
        console.log(`Query Named Query: ... All papers in org.copnet.vdxpaper that are in current state of ${data.status}`);
        const result = await contract.evaluateTransaction('queryNamed', data.status);
        // Status can be CREATED, ISSUED, CHECKED... BUT ALSO VALUE
        console.log(`Transaction Query Named has been evaluated, result is: ${result.toString()}`);
        res.status(200).json({response: result.toString()});

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to evaluate transaction Query Named: ${error}`);
        res.status(500).json({error: error});
        process.exit(1);
    }
});

app.get('/api/queryAll', async function (req, res) {
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
        // queryOperator transaction - requires 1 argument, ex: ('queryAdhoc', 'queryString')
        
        queryString = '{"selector":{"issuer":{"$ne":""}}}'
        console.log(`Query All Transactions`);
        const result = await contract.evaluateTransaction('queryAdhoc', queryString);
        // Status can be CREATED, ISSUED, CHECKED... BUT ALSO VALUE
        console.log(`Transaction Query All has been evaluated, result is: ${result.toString()}`);
        res.status(200).json({response: result.toString()});

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to evaluate transaction Query All: ${error}`);
        res.status(500).json({error: error});
        process.exit(1);
    }
});



app.listen(port);