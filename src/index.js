import React from 'react'
import ReactDOM from 'react-dom'
import { HashRouter as Router, Route, Switch } from "react-router-dom";
import './index.css'
import App from './App.js'
import ThreeOperation from './ThreeOperation/ThreeOperation.js'
import ComponentsTest from './Test/ComponentsTest.js'
// import DvaTest from './Test/DvaTest.js'
import SourceCode from './Blog/SourceCode.js'
import notFound from './404.js'

ReactDOM.render(
	<Router>
		<Switch>
			<Route path="/ThreeOperation" component={ThreeOperation}/>
			<Route path="/ComponentsTest" component={ComponentsTest}/>
			<Route path="/404" component={notFound}/>
			<Route path="/SourceCode" component={SourceCode}/>
			<Route path="/" component={App}/>
		</Switch>
	</Router>,
	document.getElementById('root')
);
