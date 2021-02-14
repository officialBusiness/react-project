import StatementParser from './extends/StatementParser.js'
import ScopeHandler from './ScopeHandler.js'
import ProductionParameterHandler from './ProductionParameterHandler.js'
import ExpressionScopeHandler from './ExpressionScopeHandler.js'
// import ClassScopeHandler from './ClassScopeHandler.js'
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
    // this.inModule = this.options.sourceType === "module"
    this.scope = new ScopeHandler(this.raise.bind(this), this.inModule)
    // this.classScope = new ClassScopeHandler(this.raise.bind(this));
    this.prodParam = new ProductionParameterHandler()
    this.expressionScope = new ExpressionScopeHandler(this.raise.bind(this))
    this.plugins = new Map()
    // this.filename = defaultOptions.sourceFilename

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
    // if (this.hasPlugin("topLevelAwait") && this.inModule) {
    //   paramFlags |= PARAM_AWAIT;
    // }
    this.scope.enter(SCOPE_PROGRAM);
    this.prodParam.enter(paramFlags);
    const file = this.startNode();
    // console.log( 'file:', file )
    const program = this.startNode();
    this.nextToken();
    file.errors = null;
    this.parseTopLevel(file, program);
    file.errors = this.state.errors;
    return file;
  }
  hasPlugin(name) {
    // return this.plugins.has(name);
    return this.plugins.has(name);
  }
  getPluginOption(plugin, name) {
    if (this.hasPlugin(plugin)) return this.plugins.get(plugin)[name];
  }
}