import State from './State.js'
export default class Ast{
	constructor({code, options = {}}) {
		this.state = new State({ code })
		console.log( code )
	}
}