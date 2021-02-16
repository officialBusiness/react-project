const keywords = new Map();

function isIdentifierStart(code) {
	if (code <= 122) {
		return true
	}
}
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
		// console.log( this.state.pos, this.input[this.state.pos], 'nextToken' )
		const curContext = this.state.context[this.state.context.length - 1]
		// console.log( 'this.state:', this.state )
		if (!(curContext == null ? void 0 : curContext.preserveSpace)){
			// console.log( 'skipSpace' )
			this.skipSpace();
		}
		this.state.start = this.state.pos;
		this.state.startLoc = this.state.curPosition();
		if (this.state.pos >= this.length) {
			// console.log( 'types.eof:', types.eof )
			// console.log( this.state.pos, this.input[this.state.pos], 'finishToken' )
			this.finishToken(types.eof);
			return;
		}
		// console.log( 'this.state.type:', this.state.type )
		const override = curContext == null ? void 0 : curContext.override;
		if (override) {
		} else {
			// console.log( this.state.pos, this.input[this.state.pos], 'getTokenFromCode' )
			this.getTokenFromCode(this.input.codePointAt(this.state.pos));
			// console.log( 'this.state.type:', this.state.type )
		}
		// console.log( 'this.state.type:', this.state.type )
	}
	skipSpace() {
		loop: while (this.state.pos < this.length) {
			const ch = this.input.charCodeAt(this.state.pos);
			// console.log( 'ch:', ch )
			// console.log( 'code['+this.state.pos+']:', this.input[this.state.pos] )
			switch (ch) {
				case 32:
					// console.log( this.state.pos, this.input[this.state.pos], 'skipSpace ++' )
					++this.state.pos;
					break;
				default:
					// console.log( this.state.pos, this.input[this.state.pos], 'skipSpace isWhitespace' )
					break loop;
			}
		}
	}
	finishToken(type, val) {
		// console.log( this.state.pos, this.input[this.state.pos], 'finishToken' )
		this.state.end = this.state.pos
		this.state.endLoc = this.state.curPosition()
		this.state.type = type
		this.state.value = val
	}
	readToken_eq_excl(code) {
		// console.log( this.state.pos, this.input[this.state.pos], 'readToken_eq_excl' )
		const next = this.input.charCodeAt(this.state.pos + 1)
		// console.log( 'next:', next )
		// console.log( this.input[this.state.pos] )
		if (next === 61) {
			this.finishOp(types.equality, this.input.charCodeAt(this.state.pos + 2) === 61 ? 3 : 2)
			return;
		}
		if (code === 61 && next === 62) {
			this.state.pos += 2
			this.finishToken(types.arrow)
			return;
		}
		this.finishOp(code === 61 ? types.eq : types.bang, 1);
	}
	getTokenFromCode(code) {
		switch (code) {
			case 49:
				// console.log( this.state.pos, this.input[this.state.pos], 'readNumber' )
				this.readNumber(false);
				return;
			case 61:
				// console.log( this.state.pos, this.input[this.state.pos], 'readToken_eq_excl' )
				this.readToken_eq_excl(code);
				return;
			default:
				if (isIdentifierStart(code)) {
					// console.log( this.state.pos, this.input[this.state.pos], 'readWord' )
					this.readWord();
					return;
				}
		}
	}
	finishOp(type, size) {
		// console.log( this.state.pos, this.input[this.state.pos], 'finishOp' )
		const str = this.input.slice(this.state.pos, this.state.pos + size);
		this.state.pos += size;
		this.finishToken(type, str);
	}
	readInt(radix, len, forceLen) {
		let total = 0;
		for (let i = 0, e = len == null ? Infinity : len; i < e; ++i) {
			const code = this.input.charCodeAt(this.state.pos);
			// console.log( this.state.pos, this.input[this.state.pos] )
			let val;
			if (_isDigit(code)) {
				// console.log( 'pass' )
				 // console.log( this.state.pos, this.input[this.state.pos] , '_isDigit('+code+')')
				val = code - 48;
			} else {
				val = Infinity;
			}
			if (val >= radix) {
				if (this.options.errorRecovery && val <= 9) {
				} else if (forceLen) {
				} else {
					break;
				}
			}
			++this.state.pos;
			total = total * radix + val;
		}
		return total;
	}
	readNumber(startsWithDot) {
		// console.log( this.state.pos, this.input[this.state.pos], 'readNumber' )
		const start = this.state.pos;
		let isOctal = false;
		if (!startsWithDot && this.readInt(10) === null) {
		}
		const str = this.input.slice(start, this.state.pos).replace(/[_mn]/g, "");
		const val = isOctal ? parseInt(str, 8) : parseFloat(str);
		// console.log( 'val:', val )
		this.finishToken(types.num, val);
	}
	readWord() {
		let word = "";
		let chunkStart = this.state.pos;
		while (this.state.pos < this.length) {
			const ch = this.input.codePointAt(this.state.pos);
			// console.log( 'this.input['+this.state.pos+']:', this.input[this.state.pos] )
			if (isIdentifierChar(ch)) {
				// console.log( 'isIdentifierChar', this.state.pos )
				this.state.pos += ch <= 0xffff ? 1 : 2;
				// console.log( 'isIdentifierChar', this.state.pos )
			} else {
				break;
			}
		}
		word += this.input.slice(chunkStart, this.state.pos);
		// console.log( 'word:', word )
		const type = keywords.get(word) || types.name;
		this.finishToken(type, word);
	}
}
class UtilParser extends Tokenizer {
	addExtra(node, key, val) {
		if (!node) {
			return
		}
		const extra = node.extra = node.extra || {};
		extra[key] = val;
	}
	isContextual(name) {
		return this.match(types.name) && this.state.value === name && !this.state.containsEsc;
	}
	canInsertSemicolon() {
		return this.match(types.eof) || this.match(types.braceR) || this.hasPrecedingLineBreak();
	}
	isLineTerminator() {
		return this.eat(types.semi) || this.canInsertSemicolon();
	}
	semicolon() {
		if (!this.isLineTerminator()) this.unexpected(null, types.semi);
	}
}
class NodeUtils extends UtilParser {
	startNode() {
		return new Node(this, this.state.start, this.state.startLoc);
	}
	startNodeAt(pos, loc) {
		return new Node(this, pos, loc);
	}
	finishNode(node, type) {
		return this.finishNodeAt(node, type, this.state.lastTokEnd, this.state.lastTokEndLoc);
	}
	finishNodeAt(node, type, pos, loc) {
		node.type = type;
		node.end = pos;
		node.loc.end = loc;
		return node;
	}
}
class ExpressionParser extends NodeUtils {
	parseBindingAtom() {
		return this.parseIdentifier();
	}
	parseMaybeAssignAllowIn(refExpressionErrors, afterLeftParse, refNeedsArrowPos) {
		return this.allowInAnd(() => this.parseExprSubscripts(refExpressionErrors));
	}
	parseExprSubscripts(refExpressionErrors) {
		const startPos = this.state.start;
		const startLoc = this.state.startLoc;
		const expr = this.parseExprAtom(refExpressionErrors);
		return this.parseSubscripts(expr, startPos, startLoc);
	}
	parseSubscripts(base, startPos, startLoc, noCalls) {
		const state = {
			maybeAsyncArrow: this.atPossibleAsyncArrow(base),
			stop: false
		}
		do {
			base = this.parseSubscript(base, startPos, startLoc, noCalls, state);
			state.maybeAsyncArrow = false;
		} while (!state.stop);
		return base;
	}
	parseSubscript(base, startPos, startLoc, noCalls, state) {
		let optional = false;
		if (!noCalls && this.match(types.parenL)) {
		} else if (optional || this.match(types.bracketL) || this.eat(types.dot)) {
		} else {
			state.stop = true;
			return base;
		}
	}
	atPossibleAsyncArrow(base) {
		return base.type === "Identifier" && base.name === "async" && this.state.lastTokEnd === base.end && !this.canInsertSemicolon() && base.end - base.start === 5 && base.start === this.state.potentialArrowAt;
	}
	parseExprAtom(refExpressionErrors) {
		switch (this.state.type) {
			case types.num:
				return this.parseLiteral(this.state.value, "NumericLiteral")
		}
	}
	parseLiteral(value, type, startPos, startLoc) {
		startPos = startPos || this.state.start
		startLoc = startLoc || this.state.startLoc
		const node = this.startNodeAt(startPos, startLoc)
		this.addExtra(node, "rawValue", value)
		this.addExtra(node, "raw", this.input.slice(startPos, this.state.end))
		node.value = value
		this.nextToken()
		return this.finishNode(node, type)
	}
	parseIdentifier(liberal) {
		const node = this.startNode()
		const name = this.parseIdentifierName(node.start, liberal)
		return this.createIdentifier(node, name);
	}
	createIdentifier(node, name) {
		node.name = name;
		node.loc.identifierName = name;
		return this.finishNode(node, "Identifier")
	}
	parseIdentifierName() {
		let name;
		const {
			type
		} = this.state
		if (type === types.name) {
			name = this.state.value
		}
		this.nextToken()
		return name
	}
	allowInAnd(callback) {
		const flags = this.prodParam.currentFlags()
		const prodParamToSet = PARAM_IN & ~flags
		if (prodParamToSet) {
			this.prodParam.enter(flags | PARAM_IN)
			try {
				return callback()
			} finally {
				this.prodParam.exit()
			}
		}
		return callback()
	}
}
class StatementParser extends ExpressionParser {
	parseTopLevel(file, program) {
		// console.log( 'parseTopLevel' )
		// console.log( 'this.state.type.label:' , this.state.type.label )
		this.parseBlockBody(program, true, true, types.eof);
		file.program = this.finishNode(program, "Program")
		return this.finishNode(file, "File");
	}
	parseBlockBody(node, allowDirectives, topLevel, end, afterBlockParse) {
		const body = node.body = []
		const directives = node.directives = []
		while (!this.match(end)) {
			const stmt = this.parseStatementContent(null, topLevel)
			body.push(stmt)
		}
		this.nextToken()
	}
	parseStatementContent(context, topLevel) {
		let starttype = this.state.type;
		const node = this.startNode();
		let kind;
		// console.log( 'starttype:', starttype )
		switch (starttype) {
			case types._const:
			case types._var:
				kind = kind || this.state.value;
				return this.parseVarStatement(node, kind);
			default:
		}
	}
	parseVarStatement(node, kind) {
		this.nextToken();
		this.parseVar(node, false, kind);
		this.semicolon();
		return this.finishNode(node, "VariableDeclaration");
	}
	parseVar(node, isFor, kind) {
		const declarations = node.declarations = [];
		node.kind = kind;
		for (;;) {
			const decl = this.startNode();
			this.parseVarId(decl, kind);
			if (this.eat(types.eq)) {
				decl.init = isFor ? this.parseMaybeAssignDisallowIn() : this.parseMaybeAssignAllowIn();
			}
			declarations.push(this.finishNode(decl, "VariableDeclarator"));
			if (!this.eat(types.comma)) {
				break
			}
		}
		return node;
	}
	parseVarId(decl, kind) {
		decl.id = this.parseBindingAtom();
	}
}
export default class Parser extends StatementParser {
	constructor(options, code) {
		console.log( 'Parser解析初始化' )
		super({}, code)
		this.options = {}
		this.prodParam = new ProductionParameterHandler()
		this.state = new State()
		this.state.init(options)
		this.input = code
		this.length = code.length
	}
	parse() {
		const file = this.startNode()
		const program = this.startNode()
		this.nextToken();
		this.parseTopLevel(file, program)
		return file
	}
}

class SourceLocation {
	constructor(start, end) {
		this.start = start
		this.end = end
	}
}
class Node {
	constructor(parser, pos, loc) {
		this.type = ""
		this.start = pos
		this.end = 0
		this.loc = new SourceLocation(loc)
	}
}
class ProductionParameterHandler {
	constructor() {
		this.stacks = []
	}
	enter(flags) {
		this.stacks.push(flags)
	}
	exit() {
		this.stacks.pop()
	}
	currentFlags() {
		return this.stacks[this.stacks.length - 1]
	}
}
class State {
	constructor() {
		this.trailingComments = []
		this.leadingComments = []
		this.commentStack = []
		this.pos = 0
		this.context = [types$1.braceStatement]
		this.strictErrors = new Map()
	}
	init(options) {
		this.strict = options.strictMode === false ? false : options.sourceType === "module"
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
		this.keyword = conf.keyword
		this.beforeExpr = !!conf.beforeExpr
		this.startsExpr = !!conf.startsExpr
		this.rightAssociative = !!conf.rightAssociative
		this.isLoop = !!conf.isLoop
		this.isAssign = !!conf.isAssign
		this.prefix = !!conf.prefix
		this.postfix = !!conf.postfix
		this.binop = conf.binop != null ? conf.binop : null
		this.updateContext = null
	}
}
const types = {
	eof: new TokenType("eof")
}
const types$1 = {}
const  PARAM_IN =     0b1000
function isIdentifierChar(code) {
	if (code < 48) {
		return code === 36;
	}
	if (code <= 122) {
		return true;
	}
	return false
}
var _isDigit = function isDigit(code) {
	return code >= 48 && code <= 57;
}