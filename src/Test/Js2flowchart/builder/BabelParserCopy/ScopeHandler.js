import Scope from './Scope.js'
import { SCOPE_ARROW, SCOPE_SIMPLE_CATCH, BIND_KIND_VALUE, SCOPE_VAR, BIND_SCOPE_VAR, BIND_SCOPE_FUNCTION, BIND_SCOPE_LEXICAL, SCOPE_PROGRAM, SCOPE_DIRECT_SUPER, SCOPE_FUNCTION, SCOPE_SUPER, SCOPE_CLASS  } from './Parameter'
import ErrorMessages from './ErrorMessages.js'

export default class ScopeHandler {
  constructor(raise, inModule) {
    this.scopeStack = [];
    this.undefinedExports = new Map();
    this.undefinedPrivateNames = new Map();
    this.raise = raise;
    this.inModule = inModule;
  }

  get inFunction() {
    return (this.currentVarScope().flags & SCOPE_FUNCTION) > 0;
  }

  get allowSuper() {
    return (this.currentThisScope().flags & SCOPE_SUPER) > 0;
  }

  get allowDirectSuper() {
    return (this.currentThisScope().flags & SCOPE_DIRECT_SUPER) > 0;
  }

  get inClass() {
    return (this.currentThisScope().flags & SCOPE_CLASS) > 0;
  }

  get inNonArrowFunction() {
    return (this.currentThisScope().flags & SCOPE_FUNCTION) > 0;
  }

  get treatFunctionsAsVar() {
    return this.treatFunctionsAsVarInScope(this.currentScope());
  }

  createScope(flags) {
    return new Scope(flags);
  }

  enter(flags) {
    this.scopeStack.push(this.createScope(flags));
  }

  exit() {
    this.scopeStack.pop();
  }

  treatFunctionsAsVarInScope(scope) {
    return !!(scope.flags & SCOPE_FUNCTION || !this.inModule && scope.flags & SCOPE_PROGRAM);
  }

  declareName(name, bindingType, pos) {
    let scope = this.currentScope();

    if (bindingType & BIND_SCOPE_LEXICAL || bindingType & BIND_SCOPE_FUNCTION) {
      this.checkRedeclarationInScope(scope, name, bindingType, pos);

      if (bindingType & BIND_SCOPE_FUNCTION) {
        scope.functions.push(name);
      } else {
        scope.lexical.push(name);
      }

      if (bindingType & BIND_SCOPE_LEXICAL) {
        this.maybeExportDefined(scope, name);
      }
    } else if (bindingType & BIND_SCOPE_VAR) {
      for (let i = this.scopeStack.length - 1; i >= 0; --i) {
        scope = this.scopeStack[i];
        this.checkRedeclarationInScope(scope, name, bindingType, pos);
        scope.var.push(name);
        this.maybeExportDefined(scope, name);
        if (scope.flags & SCOPE_VAR) break;
      }
    }

    if (this.inModule && scope.flags & SCOPE_PROGRAM) {
      this.undefinedExports.delete(name);
    }
  }

  maybeExportDefined(scope, name) {
    if (this.inModule && scope.flags & SCOPE_PROGRAM) {
      this.undefinedExports.delete(name);
    }
  }

  checkRedeclarationInScope(scope, name, bindingType, pos) {
    if (this.isRedeclaredInScope(scope, name, bindingType)) {
      this.raise(pos, ErrorMessages.VarRedeclaration, name);
    }
  }

  isRedeclaredInScope(scope, name, bindingType) {
    if (!(bindingType & BIND_KIND_VALUE)) return false;

    if (bindingType & BIND_SCOPE_LEXICAL) {
      return scope.lexical.indexOf(name) > -1 || scope.functions.indexOf(name) > -1 || scope.var.indexOf(name) > -1;
    }

    if (bindingType & BIND_SCOPE_FUNCTION) {
      return scope.lexical.indexOf(name) > -1 || !this.treatFunctionsAsVarInScope(scope) && scope.var.indexOf(name) > -1;
    }

    return scope.lexical.indexOf(name) > -1 && !(scope.flags & SCOPE_SIMPLE_CATCH && scope.lexical[0] === name) || !this.treatFunctionsAsVarInScope(scope) && scope.functions.indexOf(name) > -1;
  }

  checkLocalExport(id) {
    if (this.scopeStack[0].lexical.indexOf(id.name) === -1 && this.scopeStack[0].var.indexOf(id.name) === -1 && this.scopeStack[0].functions.indexOf(id.name) === -1) {
      this.undefinedExports.set(id.name, id.start);
    }
  }

  currentScope() {
    return this.scopeStack[this.scopeStack.length - 1];
  }

  currentVarScope() {
    for (let i = this.scopeStack.length - 1;; i--) {
      const scope = this.scopeStack[i];

      if (scope.flags & SCOPE_VAR) {
        return scope;
      }
    }
  }

  currentThisScope() {
    for (let i = this.scopeStack.length - 1;; i--) {
      const scope = this.scopeStack[i];

      if ((scope.flags & SCOPE_VAR || scope.flags & SCOPE_CLASS) && !(scope.flags & SCOPE_ARROW)) {
        return scope;
      }
    }
  }

}