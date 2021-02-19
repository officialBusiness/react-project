import React from 'react'
import Parsing from './Parse/Parse.js'
// var fs = require('fs');
// var file = fs.readFileSync('./BabelParser.js', "utf8");
// console.log(file);

export default class Components extends React.Component{
	constructor(props) {
		super(props)
		Parsing({
			code: 'var a = 1, b = 2',
			opt: {}
		})
	}
	render(){
		return (
			<div>
			</div>
		)
	}
}