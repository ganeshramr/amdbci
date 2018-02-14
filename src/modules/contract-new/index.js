import React, { Component } from 'react'
import { web3, web3Connection, web3Manager } from '../../web3';
import AMNewContract from '../resource/am-new-contract.sol';
import _ from 'lodash';
import loader from '../img/tenor.gif';

class ContractNew extends Component {

    constructor(props) {

        super(props);

        this.state = {
            readyToCompileAndCreateContract: false,
            amNewContract: undefined,
            statusMessage: 'Connecting to block chain plese wait...',
            thisTxHash: undefined,
            isCompileError: false,
            contractABI: undefined,
            thisAddress: undefined,
            connected: undefined,
            result: undefined,
            isDeployInProgress: undefined,
            showABI: false
        }

        this.compileContract = this.compileContract.bind(this);
        this.deployContract = this.deployContract.bind(this);
        this.toogleABI = this.toogleABI.bind(this);
        this.manageMiner = this.manageMiner.bind(this);

    }

    
    
    componentWillMount() {

        this.readAMNewContract(AMNewContract);

        this.setupCompiler();

        this.web3ConnectionWatch();

    }

    readAMNewContract(contractFile) {
        const rawFile = new XMLHttpRequest();
        rawFile.open('GET', contractFile, false);
        rawFile.onreadystatechange = () => {
            if(rawFile.readyState === 4) {
                if(rawFile.status === 200 || rawFile.status === 0) {
                    this.setState({
                        amNewContract: rawFile.responseText
                    });
                }
            }
        }
        rawFile.send(null);
    }

    web3ConnectionWatch() {

        let connected = true;

        setInterval(() => {

            if(!web3.isConnected()) {

                connected = false;

                this.setState({ connected })

                web3Connection.retry();

            } else if(!connected) {

                connected = true;

                this.setState({ connected })
            }

        }, 3000);
    }

    setupCompiler() {

        setTimeout(() => {

            console.log('BrowserSolc Our log', window.BrowserSolc);

            window.BrowserSolc.getVersions((soljsonSources, soljsonReleases) => {

                const compilerVersion = soljsonReleases[_.keys(soljsonReleases)[0]];

                console.log('Browser-solc compiler version',compilerVersion);

                window.BrowserSolc.loadVersion(compilerVersion, (c) => {
                    this.compiler = c;
                    this.setState({
                        statusMessage: 'Ready to create compile and deploy car contracts',
                        readyToCompileAndCreateContract: true
                    }, () => {
                        console.log('Solc Version Loaded', compilerVersion);
                    });
                });
            });

        }, 1000);
    }

    compileContract() {
        
        const optimize = 1,
            compiler = this.compiler;

        console.log('Compile And Deploy started');
        
        this.setState({
            statusMessage: 'Compiling contract',          
            isDeployInProgress: true
        });

    
        return setTimeout(() => {
            
            const result = compiler.compile(this.amNewContract(), optimize);

                if(result.errors && JSON.stringify(result.errors).match(/error/i)) {
                    
                    this.setState({
                        statusMessage: JSON.stringify(result.errors),
                        isDeployInProgress: false,
                        isCompileError: true
                    });
        
                } else {

                    this.setState({
                        result,
                        statusMessage: 'Compilation done successfully',
                        contractName: Object.keys(result.contracts)[0],
                        isDeployInProgress: false,
                        isCompileError: false
                    });
                }             
        }, 1000);


    }

    deployContract() {
        
        const { result, contractName } = this.state;

        this.setState({
            contractABI: undefined,
            showABI: false
        });

        this.getGasPriceAndEstimate(result, contractName, (err, gasPrice, gasEstimate) => {
            this.deployNewContract(result, contractName, gasPrice, gasEstimate);
        });

    }

    getGasPriceAndEstimate(result, contractName, callBackGasPriceAndEstimate) {

        console.log('Contracts', result.contracts);
        console.log('Contract Name', result.contractName);
        console.log('Get price', result.contracts[contractName]);
        const bytecode = '0x' + result.contracts[contractName].bytecode;

        web3.eth.getGasPrice((err, gasPrice) => {                
        
            if(err) {

                console.log('deployment web3.eth.getGasPrice error', err);

                this.setState({
                    statusMessage: 'deployment web3.eth.getGasPrice error: ' + err
                });

                callBackGasPriceAndEstimate(err, 0, 0);

            } else {
                
                console.log('current gasPrice (gas / ether)', gasPrice);

                web3.eth.estimateGas({data: bytecode}, (err, gasEstimate) => {

                    if(err) {

                        console.log('deployment web3.eth.estimateGas error', err);

                        this.setState({
                            statusMessage: 'deployment web3.eth.estimateGas error: ' + err
                        });

                        callBackGasPriceAndEstimate(err, 0, 0);

                    } else {

                        console.log('deployment web3.eth.estimateGas amount', gasEstimate);
                        callBackGasPriceAndEstimate(err, gasPrice, gasEstimate);

                    }                    
                });
            }
        });        
    }

    deployNewContract(result, contractName, gasPrice, gasEstimate) {

        const newContract = result.contracts[contractName],
            abi = JSON.parse(newContract.interface),
            bytecode = '0x' + newContract.bytecode,
            myContract = web3.eth.contract(abi);

        console.log('newContract', newContract);              
        console.log('bytecode', JSON.stringify(bytecode));
        console.log('abi', JSON.stringify(abi));
        console.log('myContract', myContract);
                        
        const inflatedGasCost = Math.round(1.2 * gasEstimate),
            ethCost = gasPrice * inflatedGasCost / 10000000000 / 100000000,
            warnings = result.errors ? JSON.stringify(result.errors) + ',' : ''; // show warnings if they exist

        this.setState({
            statusMessage: warnings + 'Compiled! (inflated) estimateGas amount: ' + inflatedGasCost + ' (' + ethCost+ ' Ether)'
        });

        myContract.new({from:web3.eth.accounts[0],data:bytecode,gas:inflatedGasCost}, 
            (err, newContract) => { 

                console.log('newContract', newContract);

                if(err) {

                    console.log('deployment err', err);
                    this.setState({
                        statusMessage: 'deployment error: ' + err,
                        isDeployInProgress: false
                    });

                    return null;

                } else {
        
                    if(!newContract.address) {

                        console.log('Contract transaction send: TransactionHash waiting for mining', newContract.transactionHash);

                        this.setState({
                            statusMessage: 'Contract transaction send and waiting for mining...',
                            thisTxHash: newContract.transactionHash,
                            thisAddress: 'waiting to be mined for contract address...'
                        });

                    } else {

                        console.log('Contract mined! Address', newContract.address);
                        console.log('newContract Mined', newContract);
                        this.setState({
                            statusMessage: 'Contract deployed successfully !!! ',
                            isDeployInProgress: false,
                            contractABI: abi,
                            thisAddress: newContract.address
                        });

                        return null;
                    }
                }
            }
        );
    }


    getContractOptions() {
        const { result } = this.state;

        return result ? Object.keys(result.contracts).map((key) => {
            return <option key = { key } value = { key }> { key } </option>
        }) : null;
    }


    amNewContract() {
        return this.state.amNewContract;
    }

    compiledAMNewContract() {
        return this.state.compiledAMNewContract;
    }

    toogleABI() {
        this.setState({
            showABI : !this.state.showABI
        })
    }

    onFormDataChange(field, { target }) {
        const { value } = target,   
            { amNewContract } = { ...this.state },
            updateState = { amNewContract };

        updateState[field] = value;

        this.setState(updateState);       
    }

    manageMiner(start) {
        console.log(web3Manager);
        console.log(web3);
        web3Manager.miner.start();
    }
    
    render() {

        const { 
            readyToCompileAndCreateContract,
            statusMessage,
            thisAddress,
            contractABI,
            isCompileError,
            showABI,
            isDeployInProgress,
            amNewContract,
            contractName,
            result
        } = this.state;

        return (
        <div>
            {(readyToCompileAndCreateContract && web3.isConnected()) && <div>

                <div className = "container">
                    <div className = "row">
                        <h3>Deploy smart contract</h3> <br />
                        <div className = "col-sm-6">
                            <div className="form-group">

                                <label>Contract { contractName } </label>

                                <textarea className = "form-control" rows = "21" value = { amNewContract } onChange = { this.onFormDataChange.bind(this, 'amNewContract') } />

                                <br />

                                {!result && <input type = "button" className = "btn btn-primary" value = "Compile Contract" onClick = { this.compileContract } />}

                                {result && <div>
                                    
                                    <input type = "button" className = "btn btn-primary" value = "Compile Contract" onClick = { this.compileContract } />
                                    &nbsp;&nbsp;&nbsp; Select contract &nbsp;
                                    <select value = { contractName } onChange = { this.onFormDataChange.bind(this, 'contractName') }>
                                        {this.getContractOptions()}
                                    </select>
                                    &nbsp;&nbsp;
                                    <input type = "button" className = "btn btn-primary" value = "Deploy Contract" onClick = { this.deployContract } />
                                </div>}
                            </div>
                        </div>
                        <div className = "col-sm-6">

                            {isDeployInProgress && <div>
                                <h3>{statusMessage}</h3>
                                <img src = {loader} alt = "" />
                            </div>}

                            {isDeployInProgress === false && <div>
                                <span className = "label-pill label-success">
                                    <h3>
                                        {statusMessage && statusMessage}
                                    </h3>
                                </span>

                                {(isCompileError === false && thisAddress) && <span className = "badge badge-danger" data-toggle = "collapse" data-target = "#showabi">
                                    <h4>
                                        {thisAddress}
                                    </h4>
                                </span>}<br /><br />                                

                                {contractABI && <button type = "button" className = "btn btn-primary" onClick = {this.toogleABI}>{showABI && "Hide ABI"}{!showABI && "Show ABI"}</button>}
                                
                                <br /><br />

                                {showABI && <textarea className = "form-control" readOnly value = {JSON.stringify(contractABI, 4)} rows = "9" />}

                            </div>}


                        </div>
                    </div>
                </div>                



            </div>}

            {(!(readyToCompileAndCreateContract && web3.isConnected())) && <p align = "center">
                    <img src = {loader} alt = "" />
            </p>}

        </div>
        );
    }
}

export default ContractNew;
