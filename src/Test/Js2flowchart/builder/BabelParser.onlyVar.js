class Tokenizer{
	eat(type) {
		if (this.match(type)) {
			this.nextToken();
			return true;
		}
	}
	match(type) {
		return this.state.type === type;
	}
	nextToken() {
		console.log(this.state.pos, this.input[this.state.pos], this.input.codePointAt(this.state.pos) , 'nextToken')
		let code = this.input.codePointAt(this.state.pos)
		switch (code) {
			case 32:
				++this.state.pos;
				break;
			default:
		}
		if (this.state.pos >= this.length) {
			this.finishToken(types.eof);
			return;
		}
		switch (code) {
			case 61:
				this.readToken_eq_excl(code);
				return;
			default:
				if (code <= 122) {
					this.readWord();
					return;
				}
		}
	}
	readToken_eq_excl(code) {
		const next = this.input.charCodeAt(this.state.pos + 1)
		if (next === 61) {
			this.finishOp(void 0, this.input.charCodeAt(this.state.pos + 2) === 61 ? 3 : 2)
			return;
		}
		if (code === 61 && next === 62) {
			this.state.pos += 2
			return;
		}
		this.finishOp(void 0, 1);
	}
	readWord() {
		let word = ""
		let chunkStart = this.state.pos
		while (this.state.pos < this.length) {
			console.log(this.state.pos, this.input[this.state.pos] , this.input.codePointAt(this.state.pos) , 'readWord')
			const ch = this.input.codePointAt(this.state.pos)
			if (isIdentifierChar(ch)) {
				this.state.pos += ch <= 0xffff ? 1 : 2;
			} else {
				break;
			}
		}
		word += this.input.slice(chunkStart, this.state.pos)
		// console.log( 'word:', word )
		this.finishToken(void 0, word);
	}
	finishOp(type, size) {
		const str = this.input.slice(this.state.pos, this.state.pos + size);
		this.state.pos += size;
		this.finishToken(type, str);
	}
	finishToken(type, val) {
		this.state.end = this.state.pos
		this.state.endLoc = this.state.curPosition()
		this.state.type = type
		this.state.value = val
	}
	finishNode(node, type) {
		node.type = type
		node.end = this.state.lastTokEnd
		node.loc.end = this.state.lastTokEndLoc
		return node
	}
}
class StatementParser extends Tokenizer {
	parseTopLevel(file, program) {
		console.log(this.state.pos, this.input[this.state.pos] , 'parseTopLevel')
		const body = program.body = []
		const stmt = this.parseStatementContent(null, true)
		body.push(stmt)
		console.log(this.state.pos, this.input[this.state.pos] , 'after body.push(stmt)')
		file.program = this.finishNode(program, "Program")
		this.finishNode(file, "File")
	}
	parseStatementContent(context, topLevel) {
		console.log('parseStatementContent',this.state.pos, this.input[this.state.pos])
		let starttype = this.state.type
		const node = new Node(this, this.state.start, this.state.startLoc)
		let kind
		switch (starttype) {
			case types._const:
			case types._var:
				kind = kind || this.state.value
				this.nextToken()
				this.parseVar(node, false, kind)
				return this.finishNode(node, "VariableDeclaration")
			default:
		}
	}
	parseVar(node, isFor, kind) {
		const declarations = node.declarations = [];
		node.kind = kind;
		for (;;) {
			const decl = new Node(this, this.state.start, this.state.startLoc)
			decl.id = this.parseIdentifier()
			if (this.eat(types.eq)) {
				decl.init = this.parseExprAtom()
			}
			declarations.push(this.finishNode(decl, "VariableDeclarator"));
			if (!this.eat(types.comma)) {
				break
			}
		}
		return node;
	}
	parseExprAtom() {
		switch (this.state.type) {
			case types.num:
				const node = new Node(this, this.state.start, this.state.startLoc)
				node.value = this.state.value
				this.nextToken()
				return this.finishNode(node, 'NumericLiteral')
			default:
		}
	}
	parseIdentifier(liberal) {
		const node = new Node(this, this.state.start, this.state.startLoc)
		let name;
		const { type } = this.state
		if (type === types.name) {
			name = this.state.value
		}
		this.nextToken()
		return this.createIdentifier(node, name);
	}
	createIdentifier(node, name) {
		node.name = name;
		node.loc.identifierName = name;
		return this.finishNode(node, "Identifier")
	}
}
export default class Parser extends StatementParser {
	constructor(options, code) {
		// console.log( 'Parser解析初始化' )
		super({}, code)
		this.options = {}
		this.state = new State()
		this.state.init(options)
		this.input = code
		this.length = code.length
	}
	parse() {
		const file = new Node(this, this.state.start, this.state.startLoc)
		const program = new Node(this, this.state.start, this.state.startLoc)
		this.nextToken();
		this.parseTopLevel(file, program)
		console.log( 'file:', file )
		return file
	}
}
class Node {
	constructor(parser, pos, loc) {
		this.type = ""
		this.start = pos
		this.end = 0
		this.loc = {
			start: loc
		}
	}
}
class State {
	constructor() {
		this.pos = 0
		this.context = [void 0]
	}
	init(options) {
		this.curLine = options.startLine
		this.startLoc = this.endLoc = this.curPosition()
	}
	curPosition() {
		return {
			line: this.curLine,
			column: this.pos - this.lineStart
		}
	}
}
class TokenType {
	constructor(label, conf = {}) {
		this.label = label
		this.updateContext = null
	}
}
const types = {
	eof: new TokenType("eof")
}
function isIdentifierChar(code) {
	if (code < 48) {
		return code === 36;
	}
	if (code <= 122) {
		return true;
	}
	return false
}