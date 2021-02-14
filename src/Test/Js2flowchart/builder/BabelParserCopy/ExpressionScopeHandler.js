import ExpressionScope from './ExpressionScope.js'
import { kMaybeAsyncArrowParameterDeclaration } from './Parameter.js'

export default class ExpressionScopeHandler {
  constructor(raise) {
    this.stack = [new ExpressionScope()];
    this.raise = raise;
  }
}