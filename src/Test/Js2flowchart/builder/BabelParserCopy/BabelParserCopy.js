import StatementParser from './extends/StatementParser.js'
import ScopeHandler from './ScopeHandler.js'
import ProductionParameterHandler from './ProductionParameterHandler.js'
import ExpressionScopeHandler from './ExpressionScopeHandler.js'
import State from './State.js'
import { PARAM, PARAM_AWAIT, SCOPE_PROGRAM } from './Parameter.js'

const defaultOptions = {
  sourceType: "script",
  sourceFilename: undefined,
  startLine: 1,
  allowAwaitOutsideFunction: false,
  allowReturnOutsideFunction: false,
  allowImportExportEverywhere: false,
  allowSuperOutsideMethod: false,
  allowUndeclaredExports: false,
  plugins: [],
  strictMode: null,
  ranges: false,
  tokens: false,
  createParenthesizedExpressions: false,
  errorRecovery: false
}

export default class Parser extends StatementParser {
  constructor(options, code) {
    console.log( 'Parser解析初始化' )
    super(defaultOptions, code)
    this.options = defaultOptions
    this.scope = new ScopeHandler(this.raise.bind(this), this.inModule)
    this.prodParam = new ProductionParameterHandler()
    this.expressionScope = new ExpressionScopeHandler(this.raise.bind(this))
    this.plugins = new Map()
    this.tokens = [];
    this.state = new State();
    this.state.init(options);
    this.input = code;
    this.length = code.length;
    this.isLookahead = false;
    this.sawUnambiguousESM = false;
    this.ambiguousScriptDifferentAst = false;
  }
  raise(pos, errorTemplate, ...params) {
    return this.raiseWithData(pos, undefined, errorTemplate, ...params);
  }
  parse() {
    let paramFlags = PARAM;
    const file = this.startNode()
    const program = this.startNode()
    this.nextToken();
    this.parseTopLevel(file, program)
    // console.log( 'program:', program )
    // console.log( 'file:', file )
    return file;
    // return []
  }
}