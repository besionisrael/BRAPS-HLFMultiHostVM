export CORE_PEER_TLS_ENABLED=true
export ORDERER_CA=${PWD}/../vm4/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
export PEER0_ORG3_CA=${PWD}/crypto-config/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt
export FABRIC_CFG_PATH=${PWD}/../../artifacts/channel/config/


export CHANNEL_NAME=mychannel

setGlobalsForPeer0Org3() {
    export CORE_PEER_LOCALMSPID="Org3MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG3_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/crypto-config/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp
    export CORE_PEER_ADDRESS=localhost:11051

}

setGlobalsForPeer1Org3() {
    export CORE_PEER_LOCALMSPID="Org3MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG3_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/crypto-config/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp
    export CORE_PEER_ADDRESS=localhost:12051

}

CC_RUNTIME_LANGUAGE="node" #It can be golang, node, typescript or java.
CC_SRC_PATH="./../../artifacts/src" # Path to SRC Chaincode
CHANNEL_NAME="mychannel"
VERSION="1"
CC_NAME="papervdx" #Chaincode Name
#NOTA: You have to execute the following functions one by one by decommenting in succession  only the call of the function needed following the numbered order.
#1
# presetup
presetup() {
    if [ "$CC_RUNTIME_LANGUAGE" = "node" ]; then
        echo Node JavaScript No presetup...

    elif [ "$CC_RUNTIME_LANGUAGE" = "go" ]; then
        echo Vendoring Go dependencies ...
        pushd $CC_SRC_PATH
        GO111MODULE=on go mod vendor
        popd
        echo Finished vendoring Go dependencies

    elif [ "$CC_RUNTIME_LANGUAGE" = "typescript" ]; then
        echo Compiling TypeScript code into JavaScript...
        pushd $CC_SRC_PATH
        npm install
        npm run build
        popd
        successln "Finished compiling TypeScript code into JavaScript"
    
    elif [ "$CC_RUNTIME_LANGUAGE" = "java" ]; then
        
        echo Compiling Java code...
        pushd $CC_SRC_PATH
        ./gradlew installDist
        popd
        echo Finished compiling Java code
        CC_SRC_PATH=$CC_SRC_PATH/build/install/$CC_NAME

    else
        fatalln "The chaincode language ${CC_RUNTIME_LANGUAGE} is not supported by this script. Supported chaincode languages are: go, java, javascript, and typescript"
        exit 1
    fi
}

packageChaincode() {
    rm -rf ${CC_NAME}.tar.gz
    setGlobalsForPeer0Org3
    peer lifecycle chaincode package ${CC_NAME}.tar.gz \
        --path ${CC_SRC_PATH} --lang ${CC_RUNTIME_LANGUAGE} \
        --label ${CC_NAME}_${VERSION}
    echo "===================== Chaincode is packaged on peer0.org3 ===================== "
}
#2
# packageChaincode

installChaincode() {
    setGlobalsForPeer0Org3
    peer lifecycle chaincode install ${CC_NAME}.tar.gz
    echo "===================== Chaincode is installed on peer0.org3 ===================== "

}

#3
# installChaincode

queryInstalled() {
    setGlobalsForPeer0Org3
    peer lifecycle chaincode queryinstalled >&log.txt

    cat log.txt
    PACKAGE_ID=$(sed -n "/${CC_NAME}_${VERSION}/{s/^Package ID: //; s/, Label:.*$//; p;}" log.txt)
    echo PackageID is ${PACKAGE_ID}
    echo "===================== Query installed successful on peer0.org3 on channel ===================== "
}

#4
# queryInstalled

approveForMyOrg3() {
    setGlobalsForPeer0Org3
    # Replace localhost with your orderer's vm IP address
    peer lifecycle chaincode approveformyorg -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com --tls $CORE_PEER_TLS_ENABLED \
        --cafile $ORDERER_CA --channelID $CHANNEL_NAME --name ${CC_NAME} \
        --version ${VERSION} --init-required --package-id ${PACKAGE_ID} \
        --sequence ${VERSION}

    echo "===================== chaincode approved from org 3 ===================== "
}
#5
# queryInstalled
# approveForMyOrg3

checkCommitReadyness() {

    setGlobalsForPeer0Org3
    peer lifecycle chaincode checkcommitreadiness --channelID $CHANNEL_NAME \
        --peerAddresses localhost:11051 --tlsRootCertFiles $PEER0_ORG3_CA \
        --name ${CC_NAME} --version ${VERSION} --sequence ${VERSION} --output json --init-required
    echo "===================== checking commit readyness from org 3 ===================== "
}

#6
# checkCommitReadyness
