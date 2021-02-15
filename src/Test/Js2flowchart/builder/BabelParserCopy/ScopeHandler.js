import { SCOPE_ARROW, SCOPE_SIMPLE_CATCH, BIND_KIND_VALUE, SCOPE_VAR, BIND_SCOPE_VAR, BIND_SCOPE_FUNCTION, BIND_SCOPE_LEXICAL, SCOPE_PROGRAM, SCOPE_DIRECT_SUPER, SCOPE_FUNCTION, SCOPE_SUPER, SCOPE_CLASS  } from './Parameter'
class Scope {
  constructor(flags) {
    this.flags = void 0;
    this.var = [];
    this.lexical = [];
    this.functions = [];
    this.flags = flags;
  }
}
export default class ScopeHandler {
  constructor(raise, inModule) {
    this.scopeStack = [];
    this.undefinedExports = new Map();
    this.undefinedPrivateNames = new Map();
    this.raise = raise;
    this.inModule = inModule;
  }
}