import StatementParser from './extends/StatementParser.js'
import ProductionParameterHandler from './ProductionParameterHandler.js'
import State from './State.js'

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