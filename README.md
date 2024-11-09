# Network Configuration Guide for Hyperledger Fabric Multi-Host Deployment

## Network Topology

The network topology includes 4 virtual machines (VMs). The first three VMs each represent an organization (RQ, SAAQ, PC). Each organization runs its own components (nodes, certificate authority, etc.) to conform to a "multihost multi-organization" deployment. The fourth VM is for an organization containing ordering nodes (Orderer Org).

## VM Installation & Configuration 

### Creating VMs

First, create virtual machines on Microsoft Azure using the **Standard_B8ms** specifications:

| Setting | Value |
|---------|--------|
| Location | canadacentral |  
| vCPUs | 8 |
| CPU Architecture | X64 |
| Memory | 32 GB | 
| Processor | Intel(R) Xeon(R) CPU E5-2673 v3 @ 2.40GHz |
| Resource disk size | 64GB |
| OS Disk Size | 1023 GB |

Note the IP addresses, which will be needed for network configuration:

| VM | Organization | IP Address |
|----|--------------|------------|
| VM1 | ORG1: PC | 10.65.20.6 |
| VM2 | ORG2: RQ | 10.65.20.7 | 
| VM3 | ORG3: SAAQ | 10.65.20.8 |
| VM4 | ORG4: Orderer | 10.65.20.9 |

Ubuntu 20.04.5 LTS was installed on these VMs.

The VMs can be created with different sizes depending on intended usage and on a different cloud provider.

### VM Configuration

All VMs must be configured following these steps. This can be done individually on each VM, or by configuring one VM and cloning the others from it.

#### Prerequisites

The following components are required:

- Operating System: Ubuntu Linux 20.04.5 LTS 64-bit
- cURL tool: Latest version  
- git
- Docker engine: Version 20.10.17 or higher
- Docker-compose: Version 2.10.2 or higher
- Go: Version go1.19.1 linux/amd64
- Node: Version 16.16.0
- npm: Version 8.11.0
- Python: 2.7.x

#### Installing Prerequisites

```bash
# 1. Install curl
sudo apt-get install curl

# 2. Install nodejs
sudo apt-get install nodejs

# 3. Install npm 
sudo apt-get install npm

# 4. Install python
sudo apt-get install python

# 5. Install Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu focal stable"
sudo apt-get update
apt-cache policy docker-ce
sudo apt-get install -y docker-ce

# 6. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.28.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
sudo apt-get upgrade

# 7. Install Go Lang
wget https://dl.google.com/go/go1.19.1.linux-amd64.tar.gz
tar -xzvf go1.19.1.linux-amd64.tar.gz
sudo mv go/ /usr/local
export GOPATH=/usr/local/go
export PATH=$PATH:$GOPATH/bin
curl -sL https://deb.nodesource.com/setup_10.x | sudo bash -
sudo apt-get install -y nodejs
```

To verify installations:
```bash
curl -V
npm -v
docker version
docker-compose version  
go version
python -V
node -v
```

#### Installing Fabric

Install Hyperledger Fabric using:

```bash
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.2.9 1.5.5
```

Add Fabric binary path to bashrc:
```bash
export PATH=$PATH:/home/ubuntu/fabric-samples/bin
```

## GitHub Repository Structure

The configuration continues using the HLFMultiHostVM GitHub repository which can be found in the Proof of Concept Resources folder or at https://github.com/besionisrael/HLFMultiHostVM. This repository should be cloned on all VMs after completing step 3.3, but initially only on VM1.

The repository contains:

### Artifacts
- Channel:
  - Config: Contains channel configuration files (configtx.yaml, core.yaml and orderer.yaml)
  - Configtx.yaml: Contains organization definitions and operating rules (endorsement policies, lifecycleEndorsement...)
  - Create-artifacts.sh: Script to create genesis block and transaction file based on configtx.yaml
  - Crypto-config.yaml: File for creating participant identities
- Src: Contains smart contract developed for our use case

### Setup1
Contains necessary services to launch for each organization specifically:
- VM1:
  - Api: Contains API service code
  - Channel-artifacts: Contains elements for joining a channel
  - Create-certificate-with-ca: Contains elements for creating certificates using CA
  - Base.yaml: Common configuration for nodes
  - createChannel.sh: Channel creation script
  - deployChaincode.sh: Chaincode deployment script for this organization
  - docker-compose: All required services for org1
- VM2: Similar to VM1
- VM3: Similar to VM1
- VM4: Similar to VM1

## Installation Flow

The network configuration follows these steps:

### Genesis block and channel Tx

Generate organization-specific crypto materials from VM1. These steps are performed from a single VM (VM1). The crypto-materials will be moved to their respective VMs after completion.

#### Crypto Material for Org1, Org2, Org3 and Orderer Org

From VM1, execute:
```bash
cd setup1/vm1/create-certificate-with-ca/
docker-compose up -d
```

This will create an org1 folder containing crypto materials in the vm1/create-certificate-with-ca/fabric-ca directory.

The script in create-certificate-with-ca.sh uses these generated elements to create certificates for all Org1 components (peer, user...). Execute:
```bash
./create-certificate-with-ca.sh
```

This creates required elements in a crypto-config directory in the same folder.

Repeat the same process with vm2, vm3, and vm4 folders.

#### Creating Channel Artifacts 

After successful crypto material generation:
```bash
cd artifacts/channel
./create-artifacts.sh
```

#### Moving Crypto Materials to their VMs

Use Git:
```bash
git add --all
git commit -m "Add CryptoMaterial"
git push
```

On other VMs, clone or pull to get the crypto materials:
```bash
git clone
```

### Creating Docker Swarm Network and Launching Services

#### Creating Docker Swarm Network

Using VM IP addresses:
- VM1: 10.65.20.6
- VM2: 10.65.20.7
- VM3: 10.65.20.8
- VM4: 10.65.20.9

1. Initialize docker swarm on VM1:
```bash
docker swarm init --advertise-addr 10.65.20.6
docker swarm join-token manager
```
Note the token returned (<token>)

2. Join other VMs to swarm:

On VM2:
```bash
docker swarm join --token <token> 10.65.20.6:2377 --advertise-addr 10.65.20.7
```

On VM3:
```bash
docker swarm join --token <token> 10.65.20.6:2377 --advertise-addr 10.65.20.8
```

On VM4:
```bash
docker swarm join --token <token> 10.65.20.6:2377 --advertise-addr 10.65.20.9
```

On VM1:
```bash
docker network create --attachable --driver overlay artifacts_test
```

Verify network creation on all VMs:
```bash
docker network ls
```

#### Running Docker Containers on all VMs

Connect to each VM and launch the docker-compose:

VM1:
```bash
cd setup1/vm1
docker-compose up -d
```

VM2:
```bash
cd setup1/vm2
docker-compose up -d
```

VM3:
```bash
cd setup1/vm3
docker-compose up -d
```

VM4:
```bash
cd setup1/vm4
docker-compose up -d
```

To check logs for a service:
```bash
docker logs orderer.example.com -f
```

## Channel and Chaincode

### Creating Channel and Node Joining

Configure the channel ("mychannel") that will group Org1, Org2, and Org3. Connect to their respective VMs to set up the channel.

#### VM1

First, verify that Org1's nodes and services are running (`docker ps`).

Edit the createChannel.sh script - replace localhost:7050 with VM4's IP (10.65.20.9) on lines 27 and 49.

Execute:
```bash
cd setup1/vm1
./createChannel.sh
```

This script runs three functions:
- createChannel
- joinChannel
- updateAnchorPeers

#### VM2

Verify Org2's nodes and services are running (`docker ps`).

The channel is already created, so first fetch channel information created by VM1, then join nodes.

Edit joinChannel.sh - replace localhost with VM4's IP on lines 28 and 49.

Execute:
```bash
cd setup1/vm2
./joinChannel.sh
```

This runs:
- fetchChannelBlock
- joinChannel
- updateAnchorPeers

#### VM3

Similar to VM2.

Verify Org3's nodes and services are running (`docker ps`).

Edit joinChannel.sh - replace localhost with VM4's IP on lines 29 and 51.

Execute:
```bash
cd setup1/vm3
./joinChannel.sh
```

To verify node channel membership:
```bash
docker exec -it peer0.org3.example.com sh
peer channel list
```

### Chaincode Deployment

Fabric 2.0 introduced chaincode lifecycle allowing multiple organizations to agree on chaincode parameters before deployment. Each Organization must Install and Approve the chaincode.

The chaincode is located in:
```
Artifacts/src
```

Written in Javascript (important for configuration instructions).

#### VM1

Use deployChaincode.sh in setup/vm1. Note the presetup() function that initializes dependencies.

Modify CC_RUNTIME_LANGUAGE based on chaincode language (Golang, Node, Typescript, or Java).

Execute functions one by one:
```bash
./deployChaincode
```

Functions:
- packageChaincode
- installChaincode
- queryInstalled
- approveMyOrg1 (change localhost on line 118 to VM4 IP)
- checkCommitReadyness

Wait for approval from Org2 and Org3 before continuing.

#### VM2

Use installAndApprove.sh in setup/vm2.

Modify CC_RUNTIME_LANGUAGE as needed.

Execute:
```bash
./installAndApprove
```

Functions:
- packageChaincode
- installChaincode
- queryInstalled
- approveMyOrg1 (change localhost on line 106 to VM4 IP)
- checkCommitReadyness

#### VM3

Similar to VM2, using setup/vm3 directory.

Execute:
```bash
./installAndApprove
```

### Commit Chaincode

On VM1, use CLI container for commit due to localhost references:

1. Connect to CLI:
```bash
cd setup/vm1
docker exec -it cli bash
```

2. Export environment variables:
```bash
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/channel/crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/channel/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=peer0.org1.example.com:7051
export CHANNEL_NAME="mychannel"
export CC_NAME="fabcar"
export ORDERER_CA=/etc/hyperledger/channel/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
export VERSION="1"
```

3. Commit chaincode:
```bash
peer lifecycle chaincode commit -o orderer.example.com:7050 --ordererTLSHostnameOverride orderer.example.com \
--tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA \
--channelID $CHANNEL_NAME --name ${CC_NAME} \
--peerAddresses peer0.org1.example.com:7051 --tlsRootCertFiles /etc/hyperledger/channel/crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
--peerAddresses peer0.org3.example.com:11051 --tlsRootCertFiles /etc/hyperledger/channel/crypto-config/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt \
--peerAddresses peer0.org2.example.com:9051 --tlsRootCertFiles /etc/hyperledger/channel/crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
--version ${VERSION} --sequence ${VERSION} --init-required
```

4. Query committed chaincode using queryCommitted function

5. Initialize chaincode:
```bash
peer chaincode invoke -o orderer.example.com:7050 \
--ordererTLSHostnameOverride orderer.example.com \
--tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA \
-C $CHANNEL_NAME -n ${CC_NAME} \
--peerAddresses peer0.org1.example.com:7051 --tlsRootCertFiles /etc/hyperledger/channel/crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
--peerAddresses peer0.org2.example.com:9051 --tlsRootCertFiles /etc/hyperledger/channel/crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
--peerAddresses peer0.org3.example.com:11051 --tlsRootCertFiles /etc/hyperledger/channel/crypto-config/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt \
--isInit -c '{"Args":[]}'
```

## API

Hyperledger Fabric comes with a Software Development Kit (SDK) for external access to a Fabric network and chaincode functions. We use ExpressJS to implement the API server. The API server runs in a separate instance for a more realistic implementation.

### Creating Common Connection Profile

```bash
cd setupV1/vm1/application/config
./generate-ccp.sh
```

### User Registration

Generate user identities (Client Applications) by executing enrollUser.sh in setup/vm1/api.

The enrollUser.js program uses the fabric-ca-client class to:
1. Generate private/public key pair
2. Issue certificate signing request to CA
3. Store private key and signing certificate in user wallet

We use the following identities:
- adminRQ (Org1)
- adminSAAQ (Org2)
- appUser (Org3)

### API Server

We use ExpressJS to build the API server based on actions enabled by the smart contract for each organization. The implementation uses Fabric documentation's query.js and invoke.js client code.

API folder contents:
- Dockerfile & docker-compose: node image definitions and API service definition
- apiService file containing API endpoints

Launch the service:
```bash
cd setup/vm1/docker/api
docker-compose up -d
```

Verify the certificate authority is running. If not, launch it using docker compose in vm1/create-certificate-with-ca/docker-compose.yaml

API endpoints can be accessed via Postman using [ip address]:[port] of a given organization's VM. API documentation is available at https://documenter.getpostman.com/view/3607507/2s8YsozEma

### Other Chaincode Functions

To invoke other functions:
```bash
peer chaincode query -C $CHANNEL_NAME -n ${CC_NAME} -c '{"function": "functionName","Args":["Arg1"]}'
```

The API service uses:
- ccpPath: path to connection-org1.json (connection profile)
- connection-org1.json: connection profile for proper Fabric network connection
- Common connection profile (connection-orgX.json) obtained directly from fabric network

The instructions for building the API service are similar for all three organizations (VMs). Just use the appropriate folder for each VM.

### Troubleshooting

1. Always verify services are running with `docker ps`
2. Check logs using `docker logs [container_name] -f`
3. Ensure correct IP addresses are used in configuration files
4. Verify certificate authorities are running
5. Check network connectivity between VMs
6. Ensure all required ports are open and accessible

### Security Considerations

1. Keep private keys secure
2. Use TLS for all communications
3. Implement proper access control
4. Monitor system logs
5. Regularly update security certificates
6. Follow Fabric security best practices

This completes the full configuration guide for setting up a multi-host Hyperledger Fabric network with APIs. The setup provides a production-ready environment for blockchain-based application development and deployment.

Remember to regularly backup configurations and maintain proper documentation of any customizations made to the base setup.



## License

Distributed under the MIT License. See `LICENSE` for more information.



