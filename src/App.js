import React, { Component } from 'react';
import './App.css';
import AMNew from './modules/am-new';
import { web3 } from './web3';

class App extends Component {
  render() {
    return (

      <div>
        <div className = "jumbotron jumbotron-fluid">
          <div className = "container">
            <h2 className = "display-4">Private Blockchain Admin Interface</h2>
            
            {web3.isConnected() && <p className = "lead">Ready to deploy contract</p>}

            {!web3.isConnected() && <p className = "lead">Please start your private blockchain</p>}
          </div>
        </div>

        <AMNew />
      </div>

    );
  }
}

export default App;
