import NodeUtils from './NodeUtils.js'
import { unwrapParenthesizedExpression, BIND_NONE, isStrictBindReservedWord, isStrictBindOnlyReservedWord } from '../Parameter.js'
// import ErrorMessages from '../ErrorMessages.js'
import types from '../types.js'

export default class LValParser extends NodeUtils {
  parseBindingAtom() {
    switch (this.state.type) {
      case types.bracketL:
        {
          const node = this.startNode();
          this.next();
          node.elements = this.parseBindingList(types.bracketR, 93, true);
          return this.finishNode(node, "ArrayPattern");
        }

      case types.braceL:
        return this.parseObjectLike(types.braceR, true);
    }

    return this.parseIdentifier();
  }
  checkLVal(expr, contextDescription, bindingType = BIND_NONE, checkClashes, disallowLetBinding, strictModeChanged = false) {
    switch (expr.type) {
      case "Identifier":
        const {
          name
        } = expr;
        if (this.state.strict && (strictModeChanged ? isStrictBindReservedWord(name, this.inModule) : isStrictBindOnlyReservedWord(name))) {
          // this.raise(expr.start, bindingType === BIND_NONE ? ErrorMessages.StrictEvalArguments : ErrorMessages.StrictEvalArgumentsBinding, name);
        }
        if (checkClashes) {
          if (checkClashes.has(name)) {
            // this.raise(expr.start, ErrorMessages.ParamDupe);
          } else {
            checkClashes.add(name);
          }
        }
        if (disallowLetBinding && name === "let") {
          // this.raise(expr.start, ErrorMessages.LetInLexicalBinding);
        }
        if (!(bindingType & BIND_NONE)) {
          this.scope.declareName(name, bindingType, expr.start);
        }
        break;
      case "MemberExpression":
        if (bindingType !== BIND_NONE) {
          // this.raise(expr.start, ErrorMessages.InvalidPropertyBindingPattern);
        }
        break;
      case "ObjectPattern":
        for (let _i2 = 0, _expr$properties = expr.properties; _i2 < _expr$properties.length; _i2++) {
          let prop = _expr$properties[_i2];
          if (this.isObjectProperty(prop)) prop = prop.value;else if (this.isObjectMethod(prop)) continue;
          this.checkLVal(prop, "object destructuring pattern", bindingType, checkClashes, disallowLetBinding);
        }
        break;
      case "ArrayPattern":
        for (let _i3 = 0, _expr$elements = expr.elements; _i3 < _expr$elements.length; _i3++) {
          const elem = _expr$elements[_i3];

          if (elem) {
            this.checkLVal(elem, "array destructuring pattern", bindingType, checkClashes, disallowLetBinding);
          }
        }
        break;
      case "AssignmentPattern":
        this.checkLVal(expr.left, "assignment pattern", bindingType, checkClashes);
        break;
      case "RestElement":
        this.checkLVal(expr.argument, "rest element", bindingType, checkClashes);
        break;
      case "ParenthesizedExpression":
        this.checkLVal(expr.expression, "parenthesized expression", bindingType, checkClashes);
        break;
      default:
        {
          // this.raise(expr.start, bindingType === BIND_NONE ? ErrorMessages.InvalidLhs : ErrorMessages.InvalidLhsBinding, contextDescription);
        }
    }
  }
}