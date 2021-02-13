import ExpressionScope from './ExpressionScope.js'
import { kMaybeAsyncArrowParameterDeclaration } from './Parameter.js'

export default class ExpressionScopeHandler {
  constructor(raise) {
    this.stack = [new ExpressionScope()];
    this.raise = raise;
  }

  enter(scope) {
    this.stack.push(scope);
  }

  exit() {
    this.stack.pop();
  }

  recordParameterInitializerError(pos, message) {
    const {
      stack
    } = this;
    let i = stack.length - 1;
    let scope = stack[i];

    while (!scope.isCertainlyParameterDeclaration()) {
      if (scope.canBeArrowParameterDeclaration()) {
        scope.recordDeclarationError(pos, message);
      } else {
        return;
      }

      scope = stack[--i];
    }

    this.raise(pos, message);
  }

  recordParenthesizedIdentifierError(pos, message) {
    const {
      stack
    } = this;
    const scope = stack[stack.length - 1];

    if (scope.isCertainlyParameterDeclaration()) {
      this.raise(pos, message);
    } else if (scope.canBeArrowParameterDeclaration()) {
      scope.recordDeclarationError(pos, message);
    } else {
      return;
    }
  }

  recordAsyncArrowParametersError(pos, message) {
    const {
      stack
    } = this;
    let i = stack.length - 1;
    let scope = stack[i];

    while (scope.canBeArrowParameterDeclaration()) {
      if (scope.type === kMaybeAsyncArrowParameterDeclaration) {
        scope.recordDeclarationError(pos, message);
      }

      scope = stack[--i];
    }
  }

  validateAsPattern() {
    const {
      stack
    } = this;
    const currentScope = stack[stack.length - 1];
    if (!currentScope.canBeArrowParameterDeclaration()) return;
    currentScope.iterateErrors((message, pos) => {
      this.raise(pos, message);
      let i = stack.length - 2;
      let scope = stack[i];

      while (scope.canBeArrowParameterDeclaration()) {
        scope.clearDeclarationError(pos);
        scope = stack[--i];
      }
    });
  }
}