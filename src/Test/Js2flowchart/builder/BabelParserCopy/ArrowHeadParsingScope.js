import ExpressionScope from './ExpressionScope.js'

export default class ArrowHeadParsingScope extends ExpressionScope {
  constructor(type) {
    super(type);
    this.errors = new Map();
  }

  recordDeclarationError(pos, message) {
    this.errors.set(pos, message);
  }

  clearDeclarationError(pos) {
    this.errors.delete(pos);
  }

  iterateErrors(iterator) {
    this.errors.forEach(iterator);
  }
}