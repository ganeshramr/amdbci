import Web3 from 'web3';

const blockChainLocation = 'http://private-blockchain.herokuapp.com/';

export const web3 = new Web3(new Web3.providers.HttpProvider(process.env.BLOCKCHAIN_URL));

export const web3Manager = Web3;

export const web3Connection = {
    retry: () => {
        web3.setProvider(new Web3.providers.HttpProvider(process.env.BLOCKCHAIN_URL));
        console.log('Web3 Connection Retry', web3);
    }
}
