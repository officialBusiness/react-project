import ExpressionParser from './ExpressionParser.js'
import types from '../types.js'

export default class StatementParser extends ExpressionParser {
  parseTopLevel(file, program) {
    console.log( 'parseTopLevel' )
      // console.log( 'this.state.type.label:' , this.state.type.label )
    this.parseBlockBody(program, true, true, types.eof);
    file.program = this.finishNode(program, "Program")
    return this.finishNode(file, "File");
  }
  parseBlockBody(node, allowDirectives, topLevel, end, afterBlockParse) {
    const body = node.body = [];
    const directives = node.directives = [];
    this.parseBlockOrModuleBlockBody(body, allowDirectives ? directives : undefined, topLevel, end, afterBlockParse);
  }
  parseBlockOrModuleBlockBody(body, directives, topLevel, end, afterBlockParse) {
    // console.log( 'topLevel:', topLevel )
    const oldStrict = this.state.strict;
    let hasStrictModeDirective = false;
    let parsedNonDirective = false;
    while (!this.match(end)) {
      const stmt = this.parseStatementContent(null, topLevel);
      body.push(stmt);
    }
    this.nextToken();
  }
  parseStatementContent(context, topLevel) {
    let starttype = this.state.type;
    const node = this.startNode();
    let kind;
    // console.log( 'starttype:', starttype )
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
  parseVar(node, isFor, kind) {
    const declarations = node.declarations = [];
    node.kind = kind;
    for (;;) {
      const decl = this.startNode();
      this.parseVarId(decl, kind);
      if (this.eat(types.eq)) {
        decl.init = isFor ? this.parseMaybeAssignDisallowIn() : this.parseMaybeAssignAllowIn();
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