import ExpressionParser from './ExpressionParser.js'
import types from '../types.js'
import { loneSurrogate, lineBreak, BIND_CLASS, CLASS_ELEMENT_INSTANCE_SETTER, CLASS_ELEMENT_STATIC_SETTER, CLASS_ELEMENT_INSTANCE_GETTER, CLASS_ELEMENT_STATIC_GETTER, CLASS_ELEMENT_OTHER, PARAM, newExpressionScope, SCOPE_SUPER, SCOPE_CLASS, BIND_FUNCTION, newParameterDeclarationScope, functionFlags, SCOPE_FUNCTION, FUNC_NULLABLE_ID, FUNC_NO_FLAGS, BIND_VAR, BIND_LEXICAL, SCOPE_SIMPLE_CATCH, switchLabel, isIdentifierStart, isIdentifierChar, keywordRelationalOperator, loopLabel, SCOPE_OTHER, FUNC_STATEMENT, FUNC_HANGING_STATEMENT } from '../Parameter.js'
import ExpressionErrors from '../ExpressionErrors.js'

export default class StatementParser extends ExpressionParser {
  parseTopLevel(file, program) {
    this.parseBlockBody(program, true, true, types.eof);
    if (this.inModule && !this.options.allowUndeclaredExports && this.scope.undefinedExports.size > 0) {
      for (let _i = 0, _Array$from = Array.from(this.scope.undefinedExports); _i < _Array$from.length; _i++) {
        const [name] = _Array$from[_i]
      }
    }
    file.program = this.finishNode(program, "Program")
    return this.finishNode(file, "File");
  }
  parseInterpreterDirective() {
    if (!this.match(types.interpreterDirective)) {
      return null;
    }

    const node = this.startNode();
    node.value = this.state.value;
    this.next();
    return this.finishNode(node, "InterpreterDirective");
  }
  parseStatement(context, topLevel) {
    return this.parseStatementContent(context, topLevel);
  }
  parseStatementContent(context, topLevel) {
    let starttype = this.state.type;
    const node = this.startNode();
    let kind;
    switch (starttype) {
      case types._const:
      case types._var:
        kind = kind || this.state.value;
        return this.parseVarStatement(node, kind);
      default:
    }
  }
  parseVarStatement(node, kind) {
    this.nextToken();
    this.parseVar(node, false, kind);
    this.semicolon();
    return this.finishNode(node, "VariableDeclaration");
  }
  parseBlockBody(node, allowDirectives, topLevel, end, afterBlockParse) {
    const body = node.body = [];
    const directives = node.directives = [];
    this.parseBlockOrModuleBlockBody(body, allowDirectives ? directives : undefined, topLevel, end, afterBlockParse);
  }
  parseBlockOrModuleBlockBody(body, directives, topLevel, end, afterBlockParse) {
    const oldStrict = this.state.strict;
    let hasStrictModeDirective = false;
    let parsedNonDirective = false;
    while (!this.match(end)) {
      const stmt = this.parseStatement(null, topLevel);
      body.push(stmt);
    }
    this.nextToken();
  }
  parseVar(node, isFor, kind) {
    const declarations = node.declarations = [];
    node.kind = kind;
    for (;;) {
      const decl = this.startNode();
      this.parseVarId(decl, kind);
      if (this.eat(types.eq)) {
        decl.init = isFor ? this.parseMaybeAssignDisallowIn() : this.parseMaybeAssignAllowIn();
      } else {
        decl.init = null;
      }
      declarations.push(this.finishNode(decl, "VariableDeclarator"));
      if (!this.eat(types.comma)) break;
    }
    return node;
  }
  parseVarId(decl, kind) {
    decl.id = this.parseBindingAtom();
  }
}