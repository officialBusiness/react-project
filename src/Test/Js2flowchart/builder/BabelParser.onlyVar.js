const beforeExpr = true;
const startsExpr = true;
const isLoop = true;
const isAssign = true;
const prefix = true;
const postfix = true;

const keywords = new Map();

function createKeyword(name, options = {}) {
  options.keyword = name;
  const token = new TokenType(name, options);
  keywords.set(name, token);
  return token;
}

function createBinop(name, binop) {
  return new TokenType(name, {
    beforeExpr,
    binop
  });
}

function isIdentifierStart(code) {
  if (code < 65) return code === 36;
  if (code <= 90) return true;
  if (code < 97) return code === 95;
  if (code <= 122) return true;
  if (code <= 0xffff) {
    return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code));
  }
  return isInAstralSet(code, astralIdentifierStartCodes);
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
  curContext() {
    return this.state.context[this.state.context.length - 1];
  }
  nextToken() {
    console.log( this.state.pos, this.input[this.state.pos], 'nextToken' )
    const curContext = this.curContext();
    // console.log( 'this.state:', this.state )
    if (!(curContext == null ? void 0 : curContext.preserveSpace)){
      console.log( 'skipSpace' )
      this.skipSpace();
    }
    this.state.start = this.state.pos;
    this.state.startLoc = this.state.curPosition();
    if (this.state.pos >= this.length) {
      // console.log( 'types.eof:', types.eof )
      console.log( this.state.pos, this.input[this.state.pos], 'finishToken' )
      this.finishToken(types.eof);
      return;
    }
    // console.log( 'this.state.type:', this.state.type )
    const override = curContext == null ? void 0 : curContext.override;
    if (override) {
    } else {
      console.log( this.state.pos, this.input[this.state.pos], 'getTokenFromCode' )
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
        case 160:
        case 9:
          console.log( this.state.pos, this.input[this.state.pos], 'skipSpace ++' )
          ++this.state.pos;
          break;
        default:
          if (isWhitespace(ch)) {
            // console.log( 'skipSpace isWhitespace this.state.pos:', this.state.pos )
            // ++this.state.pos;
          } else {
            console.log( this.state.pos, this.input[this.state.pos], 'skipSpace isWhitespace' )
            break loop;
          }
      }
    }
  }
  finishToken(type, val) {
    console.log( this.state.pos, this.input[this.state.pos], 'finishToken' )
    this.state.end = this.state.pos
    this.state.endLoc = this.state.curPosition()
    const prevType = this.state.type
    this.state.type = type
    this.state.value = val
  }
  readToken_eq_excl(code) {
    console.log( this.state.pos, this.input[this.state.pos], 'readToken_eq_excl' )
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
      case 50:
      case 51:
      case 52:
      case 53:
      case 54:
      case 55:
      case 56:
      case 57:
        console.log( this.state.pos, this.input[this.state.pos], 'readNumber' )
        this.readNumber(false);
        return;
      case 61:
      case 33:
        console.log( this.state.pos, this.input[this.state.pos], 'readToken_eq_excl' )
        this.readToken_eq_excl(code);
        return;
      default:
        if (isIdentifierStart(code)) {
          console.log( this.state.pos, this.input[this.state.pos], 'readWord' )
          this.readWord();
          return;
        }
    }
  }
  finishOp(type, size) {
    console.log( this.state.pos, this.input[this.state.pos], 'finishOp' )
    const str = this.input.slice(this.state.pos, this.state.pos + size);
    this.state.pos += size;
    this.finishToken(type, str);
  }
  readInt(radix, len, forceLen, allowNumSeparator = true) {
    const start = this.state.pos;
    const forbiddenSiblings = radix === 16 ? forbiddenNumericSeparatorSiblings.hex : forbiddenNumericSeparatorSiblings.decBinOct;
    const allowedSiblings = radix === 16 ? allowedNumericSeparatorSiblings.hex : radix === 10 ? allowedNumericSeparatorSiblings.dec : radix === 8 ? allowedNumericSeparatorSiblings.oct : allowedNumericSeparatorSiblings.bin;
    let invalid = false;
    let total = 0;
    for (let i = 0, e = len == null ? Infinity : len; i < e; ++i) {
      const code = this.input.charCodeAt(this.state.pos);
      // console.log( this.state.pos, this.input[this.state.pos] )
      let val;
      if (_isDigit(code)) {
        // console.log( 'pass' )
         console.log( this.state.pos, this.input[this.state.pos] , '_isDigit('+code+')')
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
    console.log( this.state.pos, this.input[this.state.pos], 'readNumber' )
    const start = this.state.pos;
    let isOctal = false;
    if (!startsWithDot && this.readInt(10) === null) {
    }
    const str = this.input.slice(start, this.state.pos).replace(/[_mn]/g, "");
    const val = isOctal ? parseInt(str, 8) : parseFloat(str);
    console.log( 'val:', val )
    this.finishToken(types.num, val);
  }
  readWord() {
    let word = "";
    let chunkStart = this.state.pos;
    while (this.state.pos < this.length) {
      const ch = this.input.codePointAt(this.state.pos);
      // console.log( 'this.input['+this.state.pos+']:', this.input[this.state.pos] )
      if (isIdentifierChar(ch)) {
        console.log( 'isIdentifierChar', this.state.pos )
        this.state.pos += ch <= 0xffff ? 1 : 2;
        console.log( 'isIdentifierChar', this.state.pos )
      } else {
        break;
      }
    }
    word += this.input.slice(chunkStart, this.state.pos);
    console.log( 'word:', word )
    const type = keywords.get(word) || types.name;
    this.finishToken(type, word);
  }
}
class UtilParser extends Tokenizer {
  addExtra(node, key, val) {
    if (!node) return;
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
    const canBeArrow = this.state.potentialArrowAt === this.state.start;
    let node;
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
  parseIdentifierName(pos, liberal) {
    let name;
    const {
      start,
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
    console.log( 'parseTopLevel' )
      // console.log( 'this.state.type.label:' , this.state.type.label )
    this.parseBlockBody(program, true, true, types.eof);
    file.program = this.finishNode(program, "Program")
    return this.finishNode(file, "File");
  }
  parseBlockBody(node, allowDirectives, topLevel, end, afterBlockParse) {
    const body = node.body = [];
    const directives = node.directives = [];
    this.parseBlockOrModuleBlockBody(body, allowDirectives ? directives : undefined, topLevel, end, afterBlockParse);
  }
  parseBlockOrModuleBlockBody(body, directives, topLevel, end, afterBlockParse) {
    // console.log( 'topLevel:', topLevel )
    const oldStrict = this.state.strict;
    let hasStrictModeDirective = false;
    let parsedNonDirective = false;
    while (!this.match(end)) {
      const stmt = this.parseStatementContent(null, topLevel);
      body.push(stmt);
    }
    this.nextToken();
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
      if (!this.eat(types.comma)) break;
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
    this.state = new State();
    this.state.init(options);
    this.input = code;
    this.length = code.length;
  }
  parse() {
    const file = this.startNode()
    const program = this.startNode()
    this.nextToken();
    this.parseTopLevel(file, program)
    // console.log( 'program:', program )
    // console.log( 'file:', file )
    return file
  }
}

class Node {
  constructor(parser, pos, loc) {
    this.type = void 0;
    this.start = void 0;
    this.end = void 0;
    this.loc = void 0;
    this.range = void 0;
    this.leadingComments = void 0;
    this.trailingComments = void 0;
    this.innerComments = void 0;
    this.extra = void 0;
    this.type = "";
    this.start = pos;
    this.end = 0;
    this.loc = new SourceLocation(loc);
    if (parser == null ? void 0 : parser.options.ranges) this.range = [pos, 0];
    if (parser == null ? void 0 : parser.filename) this.loc.filename = parser.filename;
  }
}
class ProductionParameterHandler {
  constructor() {
    this.stacks = [];
  }
  enter(flags) {
    this.stacks.push(flags);
  }
  exit() {
    this.stacks.pop();
  }
  currentFlags() {
    return this.stacks[this.stacks.length - 1];
  }
}
class State {
  constructor() {
    this.strict = void 0;
    this.curLine = void 0;
    this.startLoc = void 0;
    this.trailingComments = [];
    this.leadingComments = [];
    this.commentStack = [];
    this.pos = 0;
    this.context = [types$1.braceStatement];
    this.strictErrors = new Map();
  }
  init(options) {
    this.strict = options.strictMode === false ? false : options.sourceType === "module";
    this.curLine = options.startLine;
    this.startLoc = this.endLoc = this.curPosition();
  }
  curPosition() {
    return {
      line: this.curLine,
      column: this.pos - this.lineStart
    }
  }
}
class TokContext {
  constructor(token, isExpr, preserveSpace, override) {
    this.token = void 0;
    this.isExpr = void 0;
    this.preserveSpace = void 0;
    this.override = void 0;
    this.token = token;
    this.isExpr = !!isExpr;
    this.preserveSpace = !!preserveSpace;
    this.override = override;
  }

}
class TokenType {
  constructor(label, conf = {}) {
    this.label = void 0;
    this.keyword = void 0;
    this.beforeExpr = void 0;
    this.startsExpr = void 0;
    this.rightAssociative = void 0;
    this.isLoop = void 0;
    this.isAssign = void 0;
    this.prefix = void 0;
    this.postfix = void 0;
    this.binop = void 0;
    this.updateContext = void 0;
    this.label = label;
    this.keyword = conf.keyword;
    this.beforeExpr = !!conf.beforeExpr;
    this.startsExpr = !!conf.startsExpr;
    this.rightAssociative = !!conf.rightAssociative;
    this.isLoop = !!conf.isLoop;
    this.isAssign = !!conf.isAssign;
    this.prefix = !!conf.prefix;
    this.postfix = !!conf.postfix;
    this.binop = conf.binop != null ? conf.binop : null;
    this.updateContext = null;
  }

}
const types = {
  num: new TokenType("num", {
    startsExpr
  }),
  bigint: new TokenType("bigint", {
    startsExpr
  }),
  decimal: new TokenType("decimal", {
    startsExpr
  }),
  regexp: new TokenType("regexp", {
    startsExpr
  }),
  string: new TokenType("string", {
    startsExpr
  }),
  name: new TokenType("name", {
    startsExpr
  }),
  eof: new TokenType("eof"),
  bracketL: new TokenType("[", {
    beforeExpr,
    startsExpr
  }),
  bracketHashL: new TokenType("#[", {
    beforeExpr,
    startsExpr
  }),
  bracketBarL: new TokenType("[|", {
    beforeExpr,
    startsExpr
  }),
  bracketR: new TokenType("]"),
  bracketBarR: new TokenType("|]"),
  braceL: new TokenType("{", {
    beforeExpr,
    startsExpr
  }),
  braceBarL: new TokenType("{|", {
    beforeExpr,
    startsExpr
  }),
  braceHashL: new TokenType("#{", {
    beforeExpr,
    startsExpr
  }),
  braceR: new TokenType("}"),
  braceBarR: new TokenType("|}"),
  parenL: new TokenType("(", {
    beforeExpr,
    startsExpr
  }),
  parenR: new TokenType(")"),
  comma: new TokenType(",", {
    beforeExpr
  }),
  semi: new TokenType(";", {
    beforeExpr
  }),
  colon: new TokenType(":", {
    beforeExpr
  }),
  doubleColon: new TokenType("::", {
    beforeExpr
  }),
  dot: new TokenType("."),
  question: new TokenType("?", {
    beforeExpr
  }),
  questionDot: new TokenType("?."),
  arrow: new TokenType("=>", {
    beforeExpr
  }),
  template: new TokenType("template"),
  ellipsis: new TokenType("...", {
    beforeExpr
  }),
  backQuote: new TokenType("`", {
    startsExpr
  }),
  dollarBraceL: new TokenType("${", {
    beforeExpr,
    startsExpr
  }),
  at: new TokenType("@"),
  hash: new TokenType("#", {
    startsExpr
  }),
  interpreterDirective: new TokenType("#!..."),
  eq: new TokenType("=", {
    beforeExpr,
    isAssign
  }),
  assign: new TokenType("_=", {
    beforeExpr,
    isAssign
  }),
  incDec: new TokenType("++/--", {
    prefix,
    postfix,
    startsExpr
  }),
  bang: new TokenType("!", {
    beforeExpr,
    prefix,
    startsExpr
  }),
  tilde: new TokenType("~", {
    beforeExpr,
    prefix,
    startsExpr
  }),
  pipeline: createBinop("|>", 0),
  nullishCoalescing: createBinop("??", 1),
  logicalOR: createBinop("||", 1),
  logicalAND: createBinop("&&", 2),
  bitwiseOR: createBinop("|", 3),
  bitwiseXOR: createBinop("^", 4),
  bitwiseAND: createBinop("&", 5),
  equality: createBinop("==/!=/===/!==", 6),
  relational: createBinop("</>/<=/>=", 7),
  bitShift: createBinop("<</>>/>>>", 8),
  plusMin: new TokenType("+/-", {
    beforeExpr,
    binop: 9,
    prefix,
    startsExpr
  }),
  modulo: new TokenType("%", {
    beforeExpr,
    binop: 10,
    startsExpr
  }),
  star: new TokenType("*", {
    binop: 10
  }),
  slash: createBinop("/", 10),
  exponent: new TokenType("**", {
    beforeExpr,
    binop: 11,
    rightAssociative: true
  }),
  _break: createKeyword("break"),
  _case: createKeyword("case", {
    beforeExpr
  }),
  _catch: createKeyword("catch"),
  _continue: createKeyword("continue"),
  _debugger: createKeyword("debugger"),
  _default: createKeyword("default", {
    beforeExpr
  }),
  _do: createKeyword("do", {
    isLoop,
    beforeExpr
  }),
  _else: createKeyword("else", {
    beforeExpr
  }),
  _finally: createKeyword("finally"),
  _for: createKeyword("for", {
    isLoop
  }),
  _function: createKeyword("function", {
    startsExpr
  }),
  _if: createKeyword("if"),
  _return: createKeyword("return", {
    beforeExpr
  }),
  _switch: createKeyword("switch"),
  _throw: createKeyword("throw", {
    beforeExpr,
    prefix,
    startsExpr
  }),
  _try: createKeyword("try"),
  _var: createKeyword("var"),
  _const: createKeyword("const"),
  _while: createKeyword("while", {
    isLoop
  }),
  _with: createKeyword("with"),
  _new: createKeyword("new", {
    beforeExpr,
    startsExpr
  }),
  _this: createKeyword("this", {
    startsExpr
  }),
  _super: createKeyword("super", {
    startsExpr
  }),
  _class: createKeyword("class", {
    startsExpr
  }),
  _extends: createKeyword("extends", {
    beforeExpr
  }),
  _export: createKeyword("export"),
  _import: createKeyword("import", {
    startsExpr
  }),
  _null: createKeyword("null", {
    startsExpr
  }),
  _true: createKeyword("true", {
    startsExpr
  }),
  _false: createKeyword("false", {
    startsExpr
  }),
  _in: createKeyword("in", {
    beforeExpr,
    binop: 7
  }),
  _instanceof: createKeyword("instanceof", {
    beforeExpr,
    binop: 7
  }),
  _typeof: createKeyword("typeof", {
    beforeExpr,
    prefix,
    startsExpr
  }),
  _void: createKeyword("void", {
    beforeExpr,
    prefix,
    startsExpr
  }),
  _delete: createKeyword("delete", {
    beforeExpr,
    prefix,
    startsExpr
  })
}
const types$1 = {
  braceStatement: new TokContext("{", false),
  braceExpression: new TokContext("{", true),
  recordExpression: new TokContext("#{", true),
  templateQuasi: new TokContext("${", false),
  parenStatement: new TokContext("(", false),
  parenExpression: new TokContext("(", true),
  template: new TokContext("`", true, true, p => p.readTmplToken()),
  functionExpression: new TokContext("function", true),
  functionStatement: new TokContext("function", false)
};
types$1.j_oTag = new TokContext("<tag", false);
types$1.j_cTag = new TokContext("</tag", false);
types$1.j_expr = new TokContext("<tag>...</tag>", true, true);

const  PARAM =        0b0000
const  PARAM_YIELD =  0b0001
const  PARAM_AWAIT =  0b0010
const  PARAM_RETURN = 0b0100
const  PARAM_IN =     0b1000

const  SCOPE_OTHER =        0b00000000
const  SCOPE_PROGRAM =      0b00000001
const  SCOPE_FUNCTION =     0b00000010
const  SCOPE_ARROW =        0b00000100
const  SCOPE_SIMPLE_CATCH = 0b00001000
const  SCOPE_SUPER =        0b00010000
const  SCOPE_DIRECT_SUPER = 0b00100000
const  SCOPE_CLASS =        0b01000000
const  SCOPE_TS_MODULE =    0b10000000
const  SCOPE_VAR = SCOPE_PROGRAM | SCOPE_FUNCTION | SCOPE_TS_MODULE

const  BIND_KIND_VALUE =            0b00000000001
const  BIND_KIND_TYPE =             0b00000000010
const  BIND_SCOPE_VAR =             0b00000000100
const  BIND_SCOPE_LEXICAL =         0b00000001000
const  BIND_SCOPE_FUNCTION =        0b00000010000
const  BIND_FLAGS_NONE =            0b00001000000
const  BIND_FLAGS_CLASS =           0b00010000000
const  BIND_FLAGS_TS_ENUM =         0b00100000000
const  BIND_FLAGS_TS_CONST_ENUM =   0b01000000000
const  BIND_FLAGS_TS_EXPORT_ONLY =  0b10000000000
const  BIND_CLASS = BIND_KIND_VALUE | BIND_KIND_TYPE | BIND_SCOPE_LEXICAL | BIND_FLAGS_CLASS
const  BIND_LEXICAL = BIND_KIND_VALUE | 0 | BIND_SCOPE_LEXICAL | 0
const  BIND_VAR = BIND_KIND_VALUE | 0 | BIND_SCOPE_VAR | 0
const  BIND_FUNCTION = BIND_KIND_VALUE | 0 | BIND_SCOPE_FUNCTION | 0
const  BIND_TS_INTERFACE = 0 | BIND_KIND_TYPE | 0 | BIND_FLAGS_CLASS
const  BIND_TS_TYPE = 0 | BIND_KIND_TYPE | 0 | 0
const  BIND_TS_ENUM = BIND_KIND_VALUE | BIND_KIND_TYPE | BIND_SCOPE_LEXICAL | BIND_FLAGS_TS_ENUM
const  BIND_TS_AMBIENT = 0 | 0 | 0 | BIND_FLAGS_TS_EXPORT_ONLY
const  BIND_NONE = 0 | 0 | 0 | BIND_FLAGS_NONE
const  BIND_OUTSIDE = BIND_KIND_VALUE | 0 | 0 | BIND_FLAGS_NONE
const  BIND_TS_CONST_ENUM = BIND_TS_ENUM | BIND_FLAGS_TS_CONST_ENUM
const  BIND_TS_NAMESPACE = 0 | 0 | 0 | BIND_FLAGS_TS_EXPORT_ONLY
const  CLASS_ELEMENT_FLAG_STATIC = 0b100
const  CLASS_ELEMENT_KIND_GETTER = 0b010
const  CLASS_ELEMENT_KIND_SETTER = 0b001
const  CLASS_ELEMENT_KIND_ACCESSOR = CLASS_ELEMENT_KIND_GETTER | CLASS_ELEMENT_KIND_SETTER
const  CLASS_ELEMENT_STATIC_GETTER = CLASS_ELEMENT_KIND_GETTER | CLASS_ELEMENT_FLAG_STATIC
const  CLASS_ELEMENT_STATIC_SETTER = CLASS_ELEMENT_KIND_SETTER | CLASS_ELEMENT_FLAG_STATIC
const  CLASS_ELEMENT_INSTANCE_GETTER = CLASS_ELEMENT_KIND_GETTER
const  CLASS_ELEMENT_INSTANCE_SETTER = CLASS_ELEMENT_KIND_SETTER
const  CLASS_ELEMENT_OTHER = 0


const  kExpression = 0
const  kMaybeArrowParameterDeclaration = 1
const  kMaybeAsyncArrowParameterDeclaration = 2
const  kParameterDeclaration = 3

function newArrowHeadScope() {
  // return new ArrowHeadParsingScope(kMaybeArrowParameterDeclaration);
}
function newAsyncArrowScope() {
  // return new ArrowHeadParsingScope(kMaybeAsyncArrowParameterDeclaration);
}
let nonASCIIidentifierChars = "\u200c\u200d\xb7\u0300-\u036f\u0387\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u07fd\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u08d3-\u08e1\u08e3-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u09fe\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0afa-\u0aff\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b55-\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c00-\u0c04\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c81-\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0d00-\u0d03\u0d3b\u0d3c\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d81-\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0de6-\u0def\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0ebc\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1369-\u1371\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19d0-\u19da\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1ab0-\u1abd\u1abf\u1ac0\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf4\u1cf7-\u1cf9\u1dc0-\u1df9\u1dfb-\u1dff\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua620-\ua629\ua66f\ua674-\ua67d\ua69e\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua82c\ua880\ua881\ua8b4-\ua8c5\ua8d0-\ua8d9\ua8e0-\ua8f1\ua8ff-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\ua9e5\ua9f0-\ua9f9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b-\uaa7d\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe2f\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f";
let nonASCIIidentifierStartChars = nonASCIIidentifierChars = null;
const nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
const nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");
// const nonASCIIidentifierStartChars = nonASCIIidentifierChars = null;
const astralIdentifierStartCodes = [0, 11, 2, 25, 2, 18, 2, 1, 2, 14, 3, 13, 35, 122, 70, 52, 268, 28, 4, 48, 48, 31, 14, 29, 6, 37, 11, 29, 3, 35, 5, 7, 2, 4, 43, 157, 19, 35, 5, 35, 5, 39, 9, 51, 157, 310, 10, 21, 11, 7, 153, 5, 3, 0, 2, 43, 2, 1, 4, 0, 3, 22, 11, 22, 10, 30, 66, 18, 2, 1, 11, 21, 11, 25, 71, 55, 7, 1, 65, 0, 16, 3, 2, 2, 2, 28, 43, 28, 4, 28, 36, 7, 2, 27, 28, 53, 11, 21, 11, 18, 14, 17, 111, 72, 56, 50, 14, 50, 14, 35, 349, 41, 7, 1, 79, 28, 11, 0, 9, 21, 107, 20, 28, 22, 13, 52, 76, 44, 33, 24, 27, 35, 30, 0, 3, 0, 9, 34, 4, 0, 13, 47, 15, 3, 22, 0, 2, 0, 36, 17, 2, 24, 85, 6, 2, 0, 2, 3, 2, 14, 2, 9, 8, 46, 39, 7, 3, 1, 3, 21, 2, 6, 2, 1, 2, 4, 4, 0, 19, 0, 13, 4, 159, 52, 19, 3, 21, 2, 31, 47, 21, 1, 2, 0, 185, 46, 42, 3, 37, 47, 21, 0, 60, 42, 14, 0, 72, 26, 230, 43, 117, 63, 32, 7, 3, 0, 3, 7, 2, 1, 2, 23, 16, 0, 2, 0, 95, 7, 3, 38, 17, 0, 2, 0, 29, 0, 11, 39, 8, 0, 22, 0, 12, 45, 20, 0, 35, 56, 264, 8, 2, 36, 18, 0, 50, 29, 113, 6, 2, 1, 2, 37, 22, 0, 26, 5, 2, 1, 2, 31, 15, 0, 328, 18, 190, 0, 80, 921, 103, 110, 18, 195, 2749, 1070, 4050, 582, 8634, 568, 8, 30, 114, 29, 19, 47, 17, 3, 32, 20, 6, 18, 689, 63, 129, 74, 6, 0, 67, 12, 65, 1, 2, 0, 29, 6135, 9, 1237, 43, 8, 8952, 286, 50, 2, 18, 3, 9, 395, 2309, 106, 6, 12, 4, 8, 8, 9, 5991, 84, 2, 70, 2, 1, 3, 0, 3, 1, 3, 3, 2, 11, 2, 0, 2, 6, 2, 64, 2, 3, 3, 7, 2, 6, 2, 27, 2, 3, 2, 4, 2, 0, 4, 6, 2, 339, 3, 24, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 7, 2357, 44, 11, 6, 17, 0, 370, 43, 1301, 196, 60, 67, 8, 0, 1205, 3, 2, 26, 2, 1, 2, 0, 3, 0, 2, 9, 2, 3, 2, 0, 2, 0, 7, 0, 5, 0, 2, 0, 2, 0, 2, 2, 2, 1, 2, 0, 3, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 1, 2, 0, 3, 3, 2, 6, 2, 3, 2, 3, 2, 0, 2, 9, 2, 16, 6, 2, 2, 4, 2, 16, 4421, 42717, 35, 4148, 12, 221, 3, 5761, 15, 7472, 3104, 541, 1507, 4938];
const astralIdentifierCodes = [509, 0, 227, 0, 150, 4, 294, 9, 1368, 2, 2, 1, 6, 3, 41, 2, 5, 0, 166, 1, 574, 3, 9, 9, 370, 1, 154, 10, 176, 2, 54, 14, 32, 9, 16, 3, 46, 10, 54, 9, 7, 2, 37, 13, 2, 9, 6, 1, 45, 0, 13, 2, 49, 13, 9, 3, 2, 11, 83, 11, 7, 0, 161, 11, 6, 9, 7, 3, 56, 1, 2, 6, 3, 1, 3, 2, 10, 0, 11, 1, 3, 6, 4, 4, 193, 17, 10, 9, 5, 0, 82, 19, 13, 9, 214, 6, 3, 8, 28, 1, 83, 16, 16, 9, 82, 12, 9, 9, 84, 14, 5, 9, 243, 14, 166, 9, 71, 5, 2, 1, 3, 3, 2, 0, 2, 1, 13, 9, 120, 6, 3, 6, 4, 0, 29, 9, 41, 6, 2, 3, 9, 0, 10, 10, 47, 15, 406, 7, 2, 7, 17, 9, 57, 21, 2, 13, 123, 5, 4, 0, 2, 1, 2, 6, 2, 0, 9, 9, 49, 4, 2, 1, 2, 4, 9, 9, 330, 3, 19306, 9, 135, 4, 60, 6, 26, 9, 1014, 0, 2, 54, 8, 3, 82, 0, 12, 1, 19628, 1, 5319, 4, 4, 5, 9, 7, 3, 6, 31, 3, 149, 2, 1418, 49, 513, 54, 5, 49, 9, 0, 15, 0, 23, 4, 2, 14, 1361, 6, 2, 16, 3, 6, 2, 1, 2, 4, 262, 6, 10, 9, 419, 13, 1495, 6, 110, 6, 6, 9, 4759, 9, 787719, 239];

function isInAstralSet(code, set) {
  let pos = 0x10000;

  for (let i = 0, length = set.length; i < length; i += 2) {
    pos += set[i];
    if (pos > code) return false;
    pos += set[i + 1];
    if (pos >= code) return true;
  }

  return false;
}
function isIdentifierChar(code) {
  if (code < 48) return code === 36;
  if (code < 58) return true;
  if (code < 65) return false;
  if (code <= 90) return true;
  if (code < 97) return code === 95;
  if (code <= 122) return true;

  if (code <= 0xffff) {
    return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code));
  }

  return isInAstralSet(code, astralIdentifierStartCodes) || isInAstralSet(code, astralIdentifierCodes);
}
function functionFlags(isAsync, isGenerator) {
  return (isAsync ? PARAM_AWAIT : 0) | (isGenerator ? PARAM_YIELD : 0);
}


// const keywords = new Map();
const reservedWords = {
  keyword: ["break", "case", "catch", "continue", "debugger", "default", "do", "else", "finally", "for", "function", "if", "return", "switch", "throw", "try", "var", "const", "while", "with", "new", "this", "super", "class", "extends", "export", "import", "null", "true", "false", "in", "instanceof", "typeof", "void", "delete"],
  strict: ["implements", "interface", "let", "package", "private", "protected", "public", "static", "yield"],
  strictBind: ["eval", "arguments"]
};
const keywords$1 = new Set(reservedWords.keyword);
const reservedWordsStrictSet = new Set(reservedWords.strict);
const reservedWordsStrictBindSet = new Set(reservedWords.strictBind);
function isReservedWord(word, inModule) {
  return inModule && word === "await" || word === "enum";
}
function isStrictReservedWord(word, inModule) {
  return isReservedWord(word, inModule) || reservedWordsStrictSet.has(word);
}
function isStrictBindOnlyReservedWord(word) {
  return reservedWordsStrictBindSet.has(word);
}
function isStrictBindReservedWord(word, inModule) {
  return isStrictReservedWord(word, inModule) || isStrictBindOnlyReservedWord(word);
}
function isKeyword(word) {
  return keywords$1.has(word);
}
const keywordRelationalOperator = /^in(stanceof)?$/;
function isIteratorStart(current, next) {
  return current === 64 && next === 64;
}
const unwrapParenthesizedExpression = node => {
  return node.type === "ParenthesizedExpression" ? unwrapParenthesizedExpression(node.expression) : node;
}

const loopLabel = {
  kind: "loop"
}
const switchLabel = {
  kind: "switch"
}
const FUNC_NO_FLAGS = 0b000
const FUNC_STATEMENT = 0b001
const FUNC_HANGING_STATEMENT = 0b010
const FUNC_NULLABLE_ID = 0b100
const loneSurrogate = /[\uD800-\uDFFF]/u

const lineBreak = /\r\n?|[\n\u2028\u2029]/;
const lineBreakG = new RegExp(lineBreak.source, "g");
function isNewLine(code) {
  switch (code) {
    case 10:
    case 13:
    case 8232:
    case 8233:
      return true;

    default:
      return false;
  }
}
const skipWhiteSpace = /(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g;
function isWhitespace(code) {
  switch (code) {
    case 0x0009:
    case 0x000b:
    case 0x000c:
    case 32:
    case 160:
    case 5760:
    case 0x2000:
    case 0x2001:
    case 0x2002:
    case 0x2003:
    case 0x2004:
    case 0x2005:
    case 0x2006:
    case 0x2007:
    case 0x2008:
    case 0x2009:
    case 0x200a:
    case 0x202f:
    case 0x205f:
    case 0x3000:
    case 0xfeff:
      return true;

    default:
      return false;
  }
}
function last(stack) {
  return stack[stack.length - 1];
}

class SourceLocation {
  constructor(start, end) {
    this.start = void 0;
    this.end = void 0;
    this.filename = void 0;
    this.identifierName = void 0;
    this.start = start;
    this.end = end;
  }
}

function getLineInfo(input, offset) {
  let line = 1;
  let lineStart = 0;
  let match;
  lineBreakG.lastIndex = 0;

  while ((match = lineBreakG.exec(input)) && match.index < offset) {
    line++;
    lineStart = lineBreakG.lastIndex;
  }
  return {
    line: line,
    column: offset - lineStart
  }
}

const VALID_REGEX_FLAGS = new Set(["g", "m", "s", "i", "y", "u"]);
const allowedNumericSeparatorSiblings = {
  bin: [48, 49],
  oct: [48, 49, 50, 51, 52, 53, 54, 55],
  dec: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57],
  hex: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 65, 66, 67, 68, 69, 70, 97, 98, 99, 100, 101, 102]
}
const forbiddenNumericSeparatorSiblings = {
  decBinOct: [46, 66, 69, 79, 95, 98, 101, 111],
  hex: [46, 88, 95, 120]
}

var _isDigit = function isDigit(code) {
  return code >= 48 && code <= 57;
};


class Token {
  constructor(state) {
    this.type = state.type;
    this.value = state.value;
    this.start = state.start;
    this.end = state.end;
    this.loc = new SourceLocation(state.startLoc, state.endLoc);
  }
}