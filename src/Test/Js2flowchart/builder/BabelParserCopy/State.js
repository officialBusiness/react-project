import types from './types.js'
import types$1 from './types$1.js'

export default class State {
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