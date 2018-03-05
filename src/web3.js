import Web3 from 'web3';
import axios from 'axios';

export let blockChainConfiguredLocation = undefined;
const serverValue = axios.get('/urltouse').then((result) => {
      blockChainConfiguredLocation = result.data;
    });

export const web3 = new Web3(new Web3.providers.HttpProvider(blockChainConfiguredLocation));

export const web3Manager = Web3;

export const web3Connection = {
    retry: () => {
        return new Promise((success, failed) => {
            web3.setProvider(new Web3.providers.HttpProvider(blockChainConfiguredLocation));
            if (web3.isConnected) {
                success(true);
            } else {
                failed(false);
            }
        });
    }
}
