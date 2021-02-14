import ExpressionScope from './ExpressionScope.js'

export default class ArrowHeadParsingScope extends ExpressionScope {
  constructor(type) {
    super(type);
    this.errors = new Map();
  }
}