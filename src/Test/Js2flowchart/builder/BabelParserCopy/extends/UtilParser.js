import Tokenizer from './Tokenizer.js'
import types from '../types.js'
// import ErrorMessages from '../ErrorMessages.js'
import { isIdentifierChar, lineBreak } from '../Parameter.js'


export default class UtilParser extends Tokenizer {
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
  checkExpressionErrors(refExpressionErrors, andThrow) {
    if (!refExpressionErrors) return false;
    const {
      shorthandAssign,
      doubleProto
    } = refExpressionErrors;
    if (!andThrow) return shorthandAssign >= 0 || doubleProto >= 0;

    if (shorthandAssign >= 0) {
      this.unexpected(shorthandAssign);
    }

    if (doubleProto >= 0) {
      // this.raise(doubleProto, ErrorMessages.DuplicateProto);
    }
  }
}