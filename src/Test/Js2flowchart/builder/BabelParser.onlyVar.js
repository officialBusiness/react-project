const types$1 = {}
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
		this.state.start = this.state.pos;
		this.state.startLoc = this.state.curPosition()
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
		this.finishOp(code === 61 ? types.eq : types.bang, 1);
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
}
class ExpressionParser extends Tokenizer {
	parseExprSubscripts(refExpressionErrors) {
		const startPos = this.state.start;
		const startLoc = this.state.startLoc;
		const expr = this.parseExprAtom(refExpressionErrors);
		return this.parseSubscripts(expr, startPos, startLoc);
	}
	parseSubscripts(base, startPos, startLoc, noCalls) {
		const state = { stop: false }
		do {
			state.stop = true;
			state.maybeAsyncArrow = false;
		} while (!state.stop);
		return base;
	}
	parseExprAtom(refExpressionErrors) {
		switch (this.state.type) {
			case types.num:
				const node = new Node(this, this.state.start, this.state.startLoc)
				node.value = this.state.value
				this.nextToken()
				return this.finishNode(node, 'NumericLiteral')
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
class StatementParser extends ExpressionParser {
	parseTopLevel(file, program) {
		console.log(this.state.pos, this.input[this.state.pos] , 'parseTopLevel')
		const body = program.body = []
		const stmt = this.parseStatementContent(null, true)
		body.push(stmt)
		this.nextToken()
		file.program = this.finishNode(program, "Program")
		this.finishNode(file, "File")
	}
	parseStatementContent(context, topLevel) {
		let starttype = this.state.type
		const node = new Node(this, this.state.start, this.state.startLoc)
		let kind
		switch (starttype) {
			case types._const:
			case types._var:
				kind = kind || this.state.value;
				return this.parseVarStatement(node, kind);
			default:
		}
	}
	parseVarStatement(node, kind) {
		this.nextToken()
		this.parseVar(node, false, kind)
		return this.finishNode(node, "VariableDeclaration");
	}
	parseVar(node, isFor, kind) {
		const declarations = node.declarations = [];
		node.kind = kind;
		for (;;) {
			const decl = new Node(this, this.state.start, this.state.startLoc)
			decl.id = this.parseIdentifier()
			if (this.eat(types.eq)) {
				decl.init = this.parseExprSubscripts()
			}
			declarations.push(this.finishNode(decl, "VariableDeclarator"));
			if (!this.eat(types.comma)) {
				break
			}
		}
		return node;
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
		this.context = [types$1.braceStatement]
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