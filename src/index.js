import React from 'react'
import ReactDOM from 'react-dom'
import { HashRouter as Router, Route, Switch } from "react-router-dom";
import './index.css'
import App from './App.js'
import ThreeOperation from './ThreeOperation/ThreeOperation.js'
import Test from './Test.js'

ReactDOM.render(
	<Router>
		<Switch>
			<Route path="/ThreeOperation" component={ThreeOperation}/>
			<Route path="/Test" component={Test}/>
			<Route path="/" component={App}/>
		</Switch>
	</Router>,
	document.getElementById('root')
);
