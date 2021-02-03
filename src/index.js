import React from 'react'
import ReactDOM from 'react-dom'
import { HashRouter as Router, Route, Switch } from "react-router-dom";
import './index.css'
import App from './App.js'
import ThreeOperation from './ThreeOperation/ThreeOperation.js'
import ComponentsTest from './Test/ComponentsTest.js'
// import DvaTest from './Test/DvaTest.js'
import RichTextBoxTest from './Test/RichTextBoxTest.js'
import JsCodeToSvgFlowchart from './Test/JsCodeToSvgFlowchart.js'
import notFound from './404.js'

ReactDOM.render(
	<Router>
		<Switch>
			<Route path="/ThreeOperation" component={ThreeOperation}/>
			<Route path="/404" component={notFound}/>
			<Route path="/Test/ComponentsTest" component={ComponentsTest}/>
			<Route path="/Test/RichTextBoxTest" component={RichTextBoxTest}/>
			<Route path="/Test/JsCodeToSvgFlowchart" component={JsCodeToSvgFlowchart}/>
			<Route path="/" component={App}/>
		</Switch>
	</Router>,
	document.getElementById('root')
);

// ReactDOM.render(
// 	<>
// 	</>,
// 	document.getElementById('root')
// );
