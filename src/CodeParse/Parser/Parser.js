import State from './Parsing/State.js'
export default class Parser{
	constructor(options){
		this.state = new State()
	}
	start(code){
		this.code = code
		this.codeLength = code.length
		this.state.init()
	}
}