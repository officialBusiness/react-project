import React from 'react'
import Parser from './Parser/Parser.js'
// import { parse } from './BabelParser.js'

export default class Components extends React.Component{
	constructor(props) {
		super(props)

		new Parser({
			code: 'var a = 1, b = 2',
			opt: {}
		})
		// console.log( parse('var a = 1, b = 2', {}) )
	}
	render(){
		return (
			<div>
			</div>
		)
	}
}