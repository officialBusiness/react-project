import NodeUtils from './NodeUtils.js'
import { unwrapParenthesizedExpression, BIND_NONE, isStrictBindReservedWord, isStrictBindOnlyReservedWord } from '../Parameter.js'
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
}