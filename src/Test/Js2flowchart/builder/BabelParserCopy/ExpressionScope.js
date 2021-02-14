import { kExpression , kMaybeAsyncArrowParameterDeclaration, kMaybeArrowParameterDeclaration, kParameterDeclaration} from './Parameter.js'

export default class ExpressionScope {
  constructor(type = kExpression) {
    this.type = void 0;
    this.type = type;
  }
  canBeArrowParameterDeclaration() {
    return this.type === kMaybeAsyncArrowParameterDeclaration || this.type === kMaybeArrowParameterDeclaration;
  }
  isCertainlyParameterDeclaration() {
    return this.type === kParameterDeclaration;
  }
}