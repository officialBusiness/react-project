import NodeUtils from './NodeUtils.js'
import { PARAM_IN } from '../Parameter.js'
import types from '../types.js'

export default class ExpressionParser extends NodeUtils {
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
    startPos = startPos || this.state.start;
    startLoc = startLoc || this.state.startLoc;
    const node = this.startNodeAt(startPos, startLoc);
    this.addExtra(node, "rawValue", value);
    this.addExtra(node, "raw", this.input.slice(startPos, this.state.end));
    node.value = value;
    this.nextToken();
    return this.finishNode(node, type);
  }
  parseIdentifier(liberal) {
    const node = this.startNode();
    const name = this.parseIdentifierName(node.start, liberal);
    return this.createIdentifier(node, name);
  }
  createIdentifier(node, name) {
    node.name = name;
    node.loc.identifierName = name;
    return this.finishNode(node, "Identifier");
  }
  parseIdentifierName(pos, liberal) {
    let name;
    const {
      start,
      type
    } = this.state;
    if (type === types.name) {
      name = this.state.value;
    }
    this.nextToken();
    return name;
  }
  allowInAnd(callback) {
    const flags = this.prodParam.currentFlags();
    const prodParamToSet = PARAM_IN & ~flags;

    if (prodParamToSet) {
      this.prodParam.enter(flags | PARAM_IN);
      try {
        return callback();
      } finally {
        this.prodParam.exit();
      }
    }

    return callback();
  }
}