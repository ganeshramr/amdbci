import React, { Component } from 'react';
import AMNewContract from '../resource/am-new-contract.sol';
import { web3, web3Connection } from '../../web3';
import _ from 'lodash';
import loader from '../img/tenor.gif';

class AMNew extends Component {

    constructor(props) {

        super(props);

        this.state = {
            readyToCompileAndCreateContract: false,
            amNewContract: undefined,
            statusMessage: 'Connecting to block chain plese wait...',
            thisTxHash: undefined,
            contractABI: undefined,
            thisAddress: undefined,
            connected: undefined,
            isDeployInProgress: undefined,
            showABI: false,
            make: 'Honda',
            model: 'CRV',
            year: '2010',
            price: '7500',
            vin: 'some vin number'
        }

        this.compileAndDeployCarContract = this.compileAndDeployCarContract.bind(this);
        this.toogleABI = this.toogleABI.bind(this);

    }

    
    
    componentWillMount() {

        this.readAMNewContract(AMNewContract);

        this.setupCompiler();

        this.web3ConnectionWatch();

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

    compileAndDeployCarContract() {
        
        const optimize = 1,
            compiler = this.compiler,
            { make, model, year, price, vin } = this.state;

        console.log('Compile And Deploy started');
        
        this.setState({
            statusMessage: 'Compiling and deploying car contract',
            isDeployInProgress: true
        });
    
        var result = compiler.compile(this.amNewConctract(), optimize);

        if(result.errors && JSON.stringify(result.errors).match(/error/i)) {
            
            this.setState({
                statusMessage: JSON.stringify(result.errors)
            });

            return false;
        } 

        this.getGasPriceAndEstimate(result, (err, gasPrice, gasEstimate) => {
            this.deployCarContract(result, gasPrice, gasEstimate, make, model, year, price, vin);
        });

        return true;
    }

    getGasPriceAndEstimate(result, callBackGasPriceAndEstimate) {

        const bytecode = '0x' + result.contracts[':Car'].bytecode;

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

    deployCarContract(result, gasPrice, gasEstimate, make, model, year, price, vin) {

        const carContract = result.contracts[':Car'],
            abi = JSON.parse(carContract.interface),
            bytecode = '0x' + carContract.bytecode,
            myContract = web3.eth.contract(abi);

        console.log('carContract', carContract);              
        console.log('bytecode', JSON.stringify(bytecode));
        console.log('abi', JSON.stringify(abi));
        console.log('myContract', myContract);
                        
        const inflatedGasCost = Math.round(1.2 * gasEstimate),
            ethCost = gasPrice * inflatedGasCost / 10000000000 / 100000000,
            warnings = result.errors ? JSON.stringify(result.errors) + ',' : ''; // show warnings if they exist

        this.setState({
            statusMessage: warnings + 'Compiled! (inflated) estimateGas amount: ' + inflatedGasCost + ' (' + ethCost+ ' Ether)'
        });

        myContract.new(make, model, year, price, vin, web3.eth.accounts[0], 
            {from:web3.eth.accounts[0],data:bytecode,gas:inflatedGasCost}, 
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
                        console.log('Car Details', newContract.carDetails());
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

    amNewConctract() {
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

    onCarDataChange(field, { target }) {
        const { value } = target,   
            { make, model, year, price, vin } = { ...this.state },
            updateState = {make, model, year, price, vin};

        updateState[field] = value;

        updateState.year = (parseInt(updateState.year, 10) || 0).toString();
        updateState.price = parseInt(updateState.price, 10) || 0;

        this.setState(updateState);       
    }
    
    render() {

        const { 
            readyToCompileAndCreateContract,
            statusMessage,
            thisAddress,
            contractABI,
            showABI,
            isDeployInProgress,
            make, model, year, price, vin
        } = this.state;

        return (
        <div>
            {(readyToCompileAndCreateContract && web3.isConnected()) && <div>

                <div class = "container">
                    <div class = "row">
                        <h3>Deploy smart contract</h3> <br />
                        <div className = "col-sm-6">
                            <div class="form-group">

                                <label>Make</label>
                                <input type = "text"  class = "form-control" value = { make } onChange = { this.onCarDataChange.bind(this, 'make') } /> <br />
                                
                                <label>Model</label>
                                <input type = "text" class = "form-control"  value = { model } onChange = { this.onCarDataChange.bind(this, 'model') } /> <br />

                                <label>Year</label>
                                <input type = "text"  class = "form-control" value = { year } onChange = { this.onCarDataChange.bind(this, 'year') } /> <br />

                                <label>Price</label>
                                <input type = "text" class = "form-control" value = { price } onChange = { this.onCarDataChange.bind(this, 'price') } /> <br />

                                <label>VIN</label>
                                <input type = "text" class = "form-control" value = { vin } onChange = { this.onCarDataChange.bind(this, 'vin') } /> <br />

                                <input type = "button" className = "btn btn-primary" value = "Deploy Contract" onClick = { this.compileAndDeployCarContract } />
                            </div>
                        </div>
                        <div className = "col-sm-6">

                            {isDeployInProgress && <img src = {loader} alt = "" />}

                            {isDeployInProgress === false && <div>
                                <span className = "label-pill label-success">
                                    <h3>
                                        {statusMessage && statusMessage}
                                    </h3>
                                </span>

                                <span className = "badge badge-danger" data-toggle = "collapse" data-target = "#showabi">
                                    <h4>
                                        {thisAddress && thisAddress}
                                    </h4>
                                </span><br /><br />

                                {contractABI && <button type = "button" className = "btn btn-primary" onClick = {this.toogleABI}>{showABI && "Hide ABI"}{!showABI && "Show ABI"}</button>}
                                
                                <br /><br />

                                {showABI && <textarea className = "form-control" rows = "9">
                                    {JSON.stringify(contractABI, 4)}
                                </textarea>}

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

export default AMNew;
