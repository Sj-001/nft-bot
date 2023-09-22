var Web3 = require('web3');
// const { OpenSeaSDK, Chain } = require("opensea-js");
const axios = require("axios");
require("dotenv").config() 
// const keccak256 = require('keccak256')
const web3 = new Web3(process.env.RPC_URL); // Connect to Ethereum network (replace with your Infura URL)

const seaport_contract_address = process.env.SEAPORT_CONTRACT_ADDRESS

const asset_contract_address = process.env.CONTRACT_ADDRESS
const wallet_address = "0xDf2AC80661DAB9010f9B9cc88e43f3d2E1035fF4"

async function retrieveOrder(tokenId) {
  try {
    const result = await axios.get(`https://testnets-api.opensea.io/v2/orders/goerli/seaport/offers?asset_contract_address=${asset_contract_address}&token_ids=${tokenId}&order_by=created_date&order_direction=desc&limit=1`)
    var orders = result.data.orders
    var order = orders[0];
    var offer = {}
    offer.hash = order.order_hash;
    offer.protocol_address = order.protocol_address
    offer.chain = "goerli"
    return offer
  } catch (error) {
    console.log(error)
  }

}

async function fulfilOffer(tokenId, fulfillment_address){
  var offer = await retrieveOrder(tokenId)
  if(offer){
    try{
      const body = {offer: offer, fulfiller: {address: fulfillment_address}, consideration: {asset_contract_address: asset_contract_address, token_id: tokenId}}
      console.log(JSON.stringify(body))
      const result =  await axios.post("https://testnets-api.opensea.io/v2/offers/fulfillment_data", body )
      const transaction = result.data.fulfillment_data.transaction;
      console.log(transaction)
      const tx = {}
      const func_sig = web3.eth.abi.encodeFunctionSignature(transaction.function)
      const typesArray = ['((address,address,(uint8,address,uint256,uint256,uint256)[],(uint8,address,uint256,uint256,uint256,address)[],uint8,uint256,uint256,bytes32,uint256,bytes32,uint256),uint120,uint120,bytes,bytes)[]','(uint256,uint8,uint256,uint256,bytes32[])[]','((uint256,uint256)[],(uint256,uint256)[])[]','address']
      const orders = transaction.input_data.orders
      const criteriaResolvers = transaction.input_data.criteriaResolvers
      const fulfillments = transaction.input_data.fulfillments
      const recipient = transaction.input_data.recipient
      const params = web3.eth.abi.encodeParameters(typesArray, [orders, criteriaResolvers, fulfillments, recipient])
      const data = '0x' + func_sig + params.substring(2)
      tx.to = seaport_contract_address
      tx.data = data
      return tx
    }catch(error) {
      console.log(error)
    }

  }

}

async function main() {
  const privateKey = process.env.PRIVATE_KEY
  // const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  const txObject = await fulfilOffer(497, wallet_address);
  
    web3.eth.accounts.signTransaction(txObject, privateKey)
  .then((signedTx) => {
    web3.eth.sendSignedTransaction(signedTx.rawTransaction)
      .on('transactionHash', (hash) => {
        console.log(`Transaction Hash: ${hash}`);
      })
      .on('receipt', (receipt) => {
        console.log(`Transaction Receipt:`, receipt);
      })
      .on('error', (error) => {
        console.error('Transaction Error:', error);
      });
  });
 
  

}

main()

// axios.get('https://testnets-api.opensea.io/v2/orders/goerli/seaport/offers?asset_contract_address=0x76637eb92950cf17306f1d7d1e20db622e0ea6e6&token_ids=497&order_by=created_date&order_direction=desc&limit=1')
// .then((result) => {
//   var orders = result.data.orders
//   var order = orders[0];
//   var offer = {}
//   offer.hash = order.order_hash;
//   offer.protocol_address = order.protocol_address
//   offer.chain = "goerli"
//   axios.post("https://testnets-api.opensea.io/v2/offers/fulfillment_data", {offer: offer, fulfiller: {address: "0xDf2AC80661DAB9010f9B9cc88e43f3d2E1035fF4"}, consideration: {asset_contract_address: "0x76637eb92950cf17306f1d7d1e20db622e0ea6e6", token_id: "497"}}).then((result) => {
//     console.log(result.data)
//   }).catch((err) => {
//     console.log(err)
//   })
// }).catch((err) => {
//   console.error(err);
// });
  

