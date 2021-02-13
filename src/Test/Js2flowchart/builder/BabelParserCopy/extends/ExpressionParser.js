import LValParser from './LValParser.js'
import ErrorMessages from '../ErrorMessages.js'
import { isStrictReservedWord, isStrictBindReservedWord, isReservedWord, isKeyword, PARAM , PARAM_AWAIT, SCOPE_PROGRAM , newAsyncArrowScope ,isIdentifierStart, functionFlags, newArrowHeadScope, SCOPE_FUNCTION, SCOPE_SUPER, SCOPE_CLASS, SCOPE_DIRECT_SUPER, SCOPE_ARROW, PARAM_IN, newExpressionScope, PARAM_RETURN, BIND_OUTSIDE, BIND_VAR} from '../Parameter.js'
import types from '../types.js'
import types$1 from '../types$1.js'
import ExpressionErrors from '../ExpressionErrors.js'
import ExpressionScope from '../ExpressionScope.js'

export default class ExpressionParser extends LValParser {
  checkProto(prop, isRecord, protoRef, refExpressionErrors) {
    if (prop.type === "SpreadElement" || this.isObjectMethod(prop) || prop.computed || prop.shorthand) {
      return;
    }

    const key = prop.key;
    const name = key.type === "Identifier" ? key.name : key.value;

    if (name === "__proto__") {
      if (isRecord) {
        this.raise(key.start, ErrorMessages.RecordNoProto);
        return;
      }

      if (protoRef.used) {
        if (refExpressionErrors) {
          if (refExpressionErrors.doubleProto === -1) {
            refExpressionErrors.doubleProto = key.start;
          }
        } else {
          this.raise(key.start, ErrorMessages.DuplicateProto);
        }
      }

      protoRef.used = true;
    }
  }

  shouldExitDescending(expr, potentialArrowAt) {
    return expr.type === "ArrowFunctionExpression" && expr.start === potentialArrowAt;
  }

  getExpression() {
    let paramFlags = PARAM;

    if (this.hasPlugin("topLevelAwait") && this.inModule) {
      paramFlags |= PARAM_AWAIT;
    }

    this.scope.enter(SCOPE_PROGRAM);
    this.prodParam.enter(paramFlags);
    this.nextToken();
    const expr = this.parseExpression();

    if (!this.match(types.eof)) {
      this.unexpected();
    }

    expr.comments = this.state.comments;
    expr.errors = this.state.errors;
    return expr;
  }

  parseExpression(disallowIn, refExpressionErrors) {
    if (disallowIn) {
      return this.disallowInAnd(() => this.parseExpressionBase(refExpressionErrors));
    }

    return this.allowInAnd(() => this.parseExpressionBase(refExpressionErrors));
  }

  parseExpressionBase(refExpressionErrors) {
    const startPos = this.state.start;
    const startLoc = this.state.startLoc;
    const expr = this.parseMaybeAssign(refExpressionErrors);

    if (this.match(types.comma)) {
      const node = this.startNodeAt(startPos, startLoc);
      node.expressions = [expr];

      while (this.eat(types.comma)) {
        node.expressions.push(this.parseMaybeAssign(refExpressionErrors));
      }

      this.toReferencedList(node.expressions);
      return this.finishNode(node, "SequenceExpression");
    }

    return expr;
  }

  parseMaybeAssignDisallowIn(refExpressionErrors, afterLeftParse, refNeedsArrowPos) {
    return this.disallowInAnd(() => this.parseMaybeAssign(refExpressionErrors, afterLeftParse, refNeedsArrowPos));
  }

  parseMaybeAssignAllowIn(refExpressionErrors, afterLeftParse, refNeedsArrowPos) {
    return this.allowInAnd(() => this.parseMaybeAssign(refExpressionErrors, afterLeftParse, refNeedsArrowPos));
  }

  parseMaybeAssign(refExpressionErrors, afterLeftParse, refNeedsArrowPos) {
    const startPos = this.state.start;
    const startLoc = this.state.startLoc;

    if (this.isContextual("yield")) {
      if (this.prodParam.hasYield) {
        this.state.exprAllowed = true;
        let left = this.parseYield();

        if (afterLeftParse) {
          left = afterLeftParse.call(this, left, startPos, startLoc);
        }

        return left;
      }
    }

    let ownExpressionErrors;

    if (refExpressionErrors) {
      ownExpressionErrors = false;
    } else {
      refExpressionErrors = new ExpressionErrors();
      ownExpressionErrors = true;
    }

    if (this.match(types.parenL) || this.match(types.name)) {
      this.state.potentialArrowAt = this.state.start;
    }

    let left = this.parseMaybeConditional(refExpressionErrors, refNeedsArrowPos);

    if (afterLeftParse) {
      left = afterLeftParse.call(this, left, startPos, startLoc);
    }

    if (this.state.type.isAssign) {
      const node = this.startNodeAt(startPos, startLoc);
      const operator = this.state.value;
      node.operator = operator;

      if (this.match(types.eq)) {
        node.left = this.toAssignable(left, true);
        refExpressionErrors.doubleProto = -1;
      } else {
        node.left = left;
      }

      if (refExpressionErrors.shorthandAssign >= node.left.start) {
        refExpressionErrors.shorthandAssign = -1;
      }

      this.checkLVal(left, "assignment expression");
      this.next();
      node.right = this.parseMaybeAssign();
      return this.finishNode(node, "AssignmentExpression");
    } else if (ownExpressionErrors) {
      this.checkExpressionErrors(refExpressionErrors, true);
    }

    return left;
  }

  parseMaybeConditional(refExpressionErrors, refNeedsArrowPos) {
    const startPos = this.state.start;
    const startLoc = this.state.startLoc;
    const potentialArrowAt = this.state.potentialArrowAt;
    const expr = this.parseExprOps(refExpressionErrors);

    if (this.shouldExitDescending(expr, potentialArrowAt)) {
      return expr;
    }

    return this.parseConditional(expr, startPos, startLoc, refNeedsArrowPos);
  }

  parseConditional(expr, startPos, startLoc, refNeedsArrowPos) {
    if (this.eat(types.question)) {
      const node = this.startNodeAt(startPos, startLoc);
      node.test = expr;
      node.consequent = this.parseMaybeAssignAllowIn();
      this.expect(types.colon);
      node.alternate = this.parseMaybeAssign();
      return this.finishNode(node, "ConditionalExpression");
    }

    return expr;
  }

  parseExprOps(refExpressionErrors) {
    const startPos = this.state.start;
    const startLoc = this.state.startLoc;
    const potentialArrowAt = this.state.potentialArrowAt;
    const expr = this.parseMaybeUnary(refExpressionErrors);

    if (this.shouldExitDescending(expr, potentialArrowAt)) {
      return expr;
    }

    return this.parseExprOp(expr, startPos, startLoc, -1);
  }

  parseExprOp(left, leftStartPos, leftStartLoc, minPrec) {
    let prec = this.state.type.binop;

    if (prec != null && (this.prodParam.hasIn || !this.match(types._in))) {
      if (prec > minPrec) {
        const op = this.state.type;

        if (op === types.pipeline) {
          this.expectPlugin("pipelineOperator");

          if (this.state.inFSharpPipelineDirectBody) {
            return left;
          }

          this.state.inPipeline = true;
          this.checkPipelineAtInfixOperator(left, leftStartPos);
        }

        const node = this.startNodeAt(leftStartPos, leftStartLoc);
        node.left = left;
        node.operator = this.state.value;

        if (op === types.exponent && left.type === "UnaryExpression" && (this.options.createParenthesizedExpressions || !(left.extra && left.extra.parenthesized))) {
          this.raise(left.argument.start, ErrorMessages.UnexpectedTokenUnaryExponentiation);
        }

        const logical = op === types.logicalOR || op === types.logicalAND;
        const coalesce = op === types.nullishCoalescing;

        if (coalesce) {
          prec = types.logicalAND.binop;
        }

        this.next();

        if (op === types.pipeline && this.getPluginOption("pipelineOperator", "proposal") === "minimal") {
          if (this.match(types.name) && this.state.value === "await" && this.prodParam.hasAwait) {
            throw this.raise(this.state.start, ErrorMessages.UnexpectedAwaitAfterPipelineBody);
          }
        }

        node.right = this.parseExprOpRightExpr(op, prec);
        this.finishNode(node, logical || coalesce ? "LogicalExpression" : "BinaryExpression");
        const nextOp = this.state.type;

        if (coalesce && (nextOp === types.logicalOR || nextOp === types.logicalAND) || logical && nextOp === types.nullishCoalescing) {
          throw this.raise(this.state.start, ErrorMessages.MixingCoalesceWithLogical);
        }

        return this.parseExprOp(node, leftStartPos, leftStartLoc, minPrec);
      }
    }

    return left;
  }

  parseExprOpRightExpr(op, prec) {
    const startPos = this.state.start;
    const startLoc = this.state.startLoc;

    switch (op) {
      case types.pipeline:
        switch (this.getPluginOption("pipelineOperator", "proposal")) {
          case "smart":
            return this.withTopicPermittingContext(() => {
              return this.parseSmartPipelineBody(this.parseExprOpBaseRightExpr(op, prec), startPos, startLoc);
            });

          case "fsharp":
            return this.withSoloAwaitPermittingContext(() => {
              return this.parseFSharpPipelineBody(prec);
            });
        }

      default:
        return this.parseExprOpBaseRightExpr(op, prec);
    }
  }

  parseExprOpBaseRightExpr(op, prec) {
    const startPos = this.state.start;
    const startLoc = this.state.startLoc;
    return this.parseExprOp(this.parseMaybeUnary(), startPos, startLoc, op.rightAssociative ? prec - 1 : prec);
  }

  parseMaybeUnary(refExpressionErrors) {
    if (this.isContextual("await") && this.isAwaitAllowed()) {
      return this.parseAwait();
    }

    const update = this.match(types.incDec);
    const node = this.startNode();

    if (this.state.type.prefix) {
      node.operator = this.state.value;
      node.prefix = true;

      if (this.match(types._throw)) {
        this.expectPlugin("throwExpressions");
      }

      const isDelete = this.match(types._delete);
      this.next();
      node.argument = this.parseMaybeUnary();
      this.checkExpressionErrors(refExpressionErrors, true);

      if (this.state.strict && isDelete) {
        const arg = node.argument;

        if (arg.type === "Identifier") {
          this.raise(node.start, ErrorMessages.StrictDelete);
        } else if (this.hasPropertyAsPrivateName(arg)) {
          this.raise(node.start, ErrorMessages.DeletePrivateField);
        }
      }

      if (!update) {
        return this.finishNode(node, "UnaryExpression");
      }
    }

    return this.parseUpdate(node, update, refExpressionErrors);
  }

  parseUpdate(node, update, refExpressionErrors) {
    if (update) {
      this.checkLVal(node.argument, "prefix operation");
      return this.finishNode(node, "UpdateExpression");
    }

    const startPos = this.state.start;
    const startLoc = this.state.startLoc;
    let expr = this.parseExprSubscripts(refExpressionErrors);
    if (this.checkExpressionErrors(refExpressionErrors, false)) return expr;

    while (this.state.type.postfix && !this.canInsertSemicolon()) {
      const node = this.startNodeAt(startPos, startLoc);
      node.operator = this.state.value;
      node.prefix = false;
      node.argument = expr;
      this.checkLVal(expr, "postfix operation");
      this.next();
      expr = this.finishNode(node, "UpdateExpression");
    }

    return expr;
  }

  parseExprSubscripts(refExpressionErrors) {
    const startPos = this.state.start;
    const startLoc = this.state.startLoc;
    const potentialArrowAt = this.state.potentialArrowAt;
    const expr = this.parseExprAtom(refExpressionErrors);

    if (this.shouldExitDescending(expr, potentialArrowAt)) {
      return expr;
    }

    return this.parseSubscripts(expr, startPos, startLoc);
  }

  parseSubscripts(base, startPos, startLoc, noCalls) {
    const state = {
      optionalChainMember: false,
      maybeAsyncArrow: this.atPossibleAsyncArrow(base),
      stop: false
    };

    do {
      base = this.parseSubscript(base, startPos, startLoc, noCalls, state);
      state.maybeAsyncArrow = false;
    } while (!state.stop);

    return base;
  }

  parseSubscript(base, startPos, startLoc, noCalls, state) {
    if (!noCalls && this.eat(types.doubleColon)) {
      return this.parseBind(base, startPos, startLoc, noCalls, state);
    } else if (this.match(types.backQuote)) {
      return this.parseTaggedTemplateExpression(base, startPos, startLoc, state);
    }

    let optional = false;

    if (this.match(types.questionDot)) {
      if (noCalls && this.lookaheadCharCode() === 40) {
        state.stop = true;
        return base;
      }

      state.optionalChainMember = optional = true;
      this.next();
    }

    if (!noCalls && this.match(types.parenL)) {
      return this.parseCoverCallAndAsyncArrowHead(base, startPos, startLoc, state, optional);
    } else if (optional || this.match(types.bracketL) || this.eat(types.dot)) {
      return this.parseMember(base, startPos, startLoc, state, optional);
    } else {
      state.stop = true;
      return base;
    }
  }

  parseMember(base, startPos, startLoc, state, optional) {
    const node = this.startNodeAt(startPos, startLoc);
    const computed = this.eat(types.bracketL);
    node.object = base;
    node.computed = computed;
    const property = computed ? this.parseExpression() : this.parseMaybePrivateName(true);

    if (this.isPrivateName(property)) {
      if (node.object.type === "Super") {
        this.raise(startPos, ErrorMessages.SuperPrivateField);
      }

      this.classScope.usePrivateName(this.getPrivateNameSV(property), property.start);
    }

    node.property = property;

    if (computed) {
      this.expect(types.bracketR);
    }

    if (state.optionalChainMember) {
      node.optional = optional;
      return this.finishNode(node, "OptionalMemberExpression");
    } else {
      return this.finishNode(node, "MemberExpression");
    }
  }

  parseBind(base, startPos, startLoc, noCalls, state) {
    const node = this.startNodeAt(startPos, startLoc);
    node.object = base;
    node.callee = this.parseNoCallExpr();
    state.stop = true;
    return this.parseSubscripts(this.finishNode(node, "BindExpression"), startPos, startLoc, noCalls);
  }

  parseCoverCallAndAsyncArrowHead(base, startPos, startLoc, state, optional) {
    const oldMaybeInArrowParameters = this.state.maybeInArrowParameters;
    this.state.maybeInArrowParameters = true;
    this.next();
    let node = this.startNodeAt(startPos, startLoc);
    node.callee = base;

    if (state.maybeAsyncArrow) {
      this.expressionScope.enter(newAsyncArrowScope());
    }

    if (state.optionalChainMember) {
      node.optional = optional;
    }

    if (optional) {
      node.arguments = this.parseCallExpressionArguments(types.parenR, false);
    } else {
      node.arguments = this.parseCallExpressionArguments(types.parenR, state.maybeAsyncArrow, base.type === "Import", base.type !== "Super", node);
    }

    this.finishCallExpression(node, state.optionalChainMember);

    if (state.maybeAsyncArrow && this.shouldParseAsyncArrow() && !optional) {
      state.stop = true;
      this.expressionScope.validateAsPattern();
      this.expressionScope.exit();
      node = this.parseAsyncArrowFromCallExpression(this.startNodeAt(startPos, startLoc), node);
    } else {
      if (state.maybeAsyncArrow) {
        this.expressionScope.exit();
      }

      this.toReferencedArguments(node);
    }

    this.state.maybeInArrowParameters = oldMaybeInArrowParameters;
    return node;
  }

  toReferencedArguments(node, isParenthesizedExpr) {
    this.toReferencedListDeep(node.arguments, isParenthesizedExpr);
  }

  parseTaggedTemplateExpression(base, startPos, startLoc, state) {
    const node = this.startNodeAt(startPos, startLoc);
    node.tag = base;
    node.quasi = this.parseTemplate(true);

    if (state.optionalChainMember) {
      this.raise(startPos, ErrorMessages.OptionalChainingNoTemplate);
    }

    return this.finishNode(node, "TaggedTemplateExpression");
  }

  atPossibleAsyncArrow(base) {
    return base.type === "Identifier" && base.name === "async" && this.state.lastTokEnd === base.end && !this.canInsertSemicolon() && base.end - base.start === 5 && base.start === this.state.potentialArrowAt;
  }

  finishCallExpression(node, optional) {
    if (node.callee.type === "Import") {
      if (node.arguments.length === 2) {
        if (!this.hasPlugin("moduleAttributes")) {
          this.expectPlugin("importAssertions");
        }
      }

      if (node.arguments.length === 0 || node.arguments.length > 2) {
        this.raise(node.start, ErrorMessages.ImportCallArity, this.hasPlugin("importAssertions") || this.hasPlugin("moduleAttributes") ? "one or two arguments" : "one argument");
      } else {
        for (let _i = 0, _node$arguments = node.arguments; _i < _node$arguments.length; _i++) {
          const arg = _node$arguments[_i];

          if (arg.type === "SpreadElement") {
            this.raise(arg.start, ErrorMessages.ImportCallSpreadArgument);
          }
        }
      }
    }

    return this.finishNode(node, optional ? "OptionalCallExpression" : "CallExpression");
  }

  parseCallExpressionArguments(close, possibleAsyncArrow, dynamicImport, allowPlaceholder, nodeForExtra) {
    const elts = [];
    let first = true;
    const oldInFSharpPipelineDirectBody = this.state.inFSharpPipelineDirectBody;
    this.state.inFSharpPipelineDirectBody = false;

    while (!this.eat(close)) {
      if (first) {
        first = false;
      } else {
        this.expect(types.comma);

        if (this.match(close)) {
          if (dynamicImport && !this.hasPlugin("importAssertions") && !this.hasPlugin("moduleAttributes")) {
            this.raise(this.state.lastTokStart, ErrorMessages.ImportCallArgumentTrailingComma);
          }

          if (nodeForExtra) {
            this.addExtra(nodeForExtra, "trailingComma", this.state.lastTokStart);
          }

          this.next();
          break;
        }
      }

      elts.push(this.parseExprListItem(false, possibleAsyncArrow ? new ExpressionErrors() : undefined, possibleAsyncArrow ? {
        start: 0
      } : undefined, allowPlaceholder));
    }

    this.state.inFSharpPipelineDirectBody = oldInFSharpPipelineDirectBody;
    return elts;
  }

  shouldParseAsyncArrow() {
    return this.match(types.arrow) && !this.canInsertSemicolon();
  }

  parseAsyncArrowFromCallExpression(node, call) {
    var _call$extra;

    this.expect(types.arrow);
    this.parseArrowExpression(node, call.arguments, true, (_call$extra = call.extra) == null ? void 0 : _call$extra.trailingComma);
    return node;
  }

  parseNoCallExpr() {
    const startPos = this.state.start;
    const startLoc = this.state.startLoc;
    return this.parseSubscripts(this.parseExprAtom(), startPos, startLoc, true);
  }

  parseExprAtom(refExpressionErrors) {
    if (this.state.type === types.slash) this.readRegexp();
    const canBeArrow = this.state.potentialArrowAt === this.state.start;
    let node;

    switch (this.state.type) {
      case types._super:
        return this.parseSuper();

      case types._import:
        node = this.startNode();
        this.next();

        if (this.match(types.dot)) {
          return this.parseImportMetaProperty(node);
        }

        if (!this.match(types.parenL)) {
          this.raise(this.state.lastTokStart, ErrorMessages.UnsupportedImport);
        }

        return this.finishNode(node, "Import");

      case types._this:
        node = this.startNode();
        this.next();
        return this.finishNode(node, "ThisExpression");

      case types.name:
        {
          const containsEsc = this.state.containsEsc;
          const id = this.parseIdentifier();

          if (!containsEsc && id.name === "async" && !this.canInsertSemicolon()) {
            if (this.match(types._function)) {
              const last = this.state.context.length - 1;

              if (this.state.context[last] !== types$1.functionStatement) {
                throw new Error("Internal error");
              }

              this.state.context[last] = types$1.functionExpression;
              this.next();
              return this.parseFunction(this.startNodeAtNode(id), undefined, true);
            } else if (this.match(types.name)) {
              return this.parseAsyncArrowUnaryFunction(id);
            }
          }

          if (canBeArrow && this.match(types.arrow) && !this.canInsertSemicolon()) {
            this.next();
            return this.parseArrowExpression(this.startNodeAtNode(id), [id], false);
          }

          return id;
        }

      case types._do:
        {
          return this.parseDo();
        }

      case types.regexp:
        {
          const value = this.state.value;
          node = this.parseLiteral(value.value, "RegExpLiteral");
          node.pattern = value.pattern;
          node.flags = value.flags;
          return node;
        }

      case types.num:
        return this.parseLiteral(this.state.value, "NumericLiteral");

      case types.bigint:
        return this.parseLiteral(this.state.value, "BigIntLiteral");

      case types.decimal:
        return this.parseLiteral(this.state.value, "DecimalLiteral");

      case types.string:
        return this.parseLiteral(this.state.value, "StringLiteral");

      case types._null:
        node = this.startNode();
        this.next();
        return this.finishNode(node, "NullLiteral");

      case types._true:
      case types._false:
        return this.parseBooleanLiteral();

      case types.parenL:
        return this.parseParenAndDistinguishExpression(canBeArrow);

      case types.bracketBarL:
      case types.bracketHashL:
        {
          return this.parseArrayLike(this.state.type === types.bracketBarL ? types.bracketBarR : types.bracketR, false, true, refExpressionErrors);
        }

      case types.bracketL:
        {
          return this.parseArrayLike(types.bracketR, true, false, refExpressionErrors);
        }

      case types.braceBarL:
      case types.braceHashL:
        {
          return this.parseObjectLike(this.state.type === types.braceBarL ? types.braceBarR : types.braceR, false, true, refExpressionErrors);
        }

      case types.braceL:
        {
          return this.parseObjectLike(types.braceR, false, false, refExpressionErrors);
        }

      case types._function:
        return this.parseFunctionOrFunctionSent();

      case types.at:
        this.parseDecorators();

      case types._class:
        node = this.startNode();
        this.takeDecorators(node);
        return this.parseClass(node, false);

      case types._new:
        return this.parseNewOrNewTarget();

      case types.backQuote:
        return this.parseTemplate(false);

      case types.doubleColon:
        {
          node = this.startNode();
          this.next();
          node.object = null;
          const callee = node.callee = this.parseNoCallExpr();

          if (callee.type === "MemberExpression") {
            return this.finishNode(node, "BindExpression");
          } else {
            throw this.raise(callee.start, ErrorMessages.UnsupportedBind);
          }
        }

      case types.hash:
        {
          if (this.state.inPipeline) {
            node = this.startNode();

            if (this.getPluginOption("pipelineOperator", "proposal") !== "smart") {
              this.raise(node.start, ErrorMessages.PrimaryTopicRequiresSmartPipeline);
            }

            this.next();

            if (!this.primaryTopicReferenceIsAllowedInCurrentTopicContext()) {
              this.raise(node.start, ErrorMessages.PrimaryTopicNotAllowed);
            }

            this.registerTopicReference();
            return this.finishNode(node, "PipelinePrimaryTopicReference");
          }

          const nextCh = this.input.codePointAt(this.state.end);

          if (isIdentifierStart(nextCh) || nextCh === 92) {
            const start = this.state.start;
            node = this.parseMaybePrivateName(true);

            if (this.match(types._in)) {
              this.expectPlugin("privateIn");
              this.classScope.usePrivateName(node.id.name, node.start);
            } else if (this.hasPlugin("privateIn")) {
              this.raise(this.state.start, ErrorMessages.PrivateInExpectedIn, node.id.name);
            } else {
              throw this.unexpected(start);
            }

            return node;
          }
        }

      case types.relational:
        {
          if (this.state.value === "<") {
            const lookaheadCh = this.input.codePointAt(this.nextTokenStart());

            if (isIdentifierStart(lookaheadCh) || lookaheadCh === 62) {
                this.expectOnePlugin(["jsx", "flow", "typescript"]);
              }
          }
        }

      default:
        throw this.unexpected();
    }
  }

  parseAsyncArrowUnaryFunction(id) {
    const node = this.startNodeAtNode(id);
    this.prodParam.enter(functionFlags(true, this.prodParam.hasYield));
    const params = [this.parseIdentifier()];
    this.prodParam.exit();

    if (this.hasPrecedingLineBreak()) {
      this.raise(this.state.pos, ErrorMessages.LineTerminatorBeforeArrow);
    }

    this.expect(types.arrow);
    this.parseArrowExpression(node, params, true);
    return node;
  }

  parseDo() {
    this.expectPlugin("doExpressions");
    const node = this.startNode();
    this.next();
    const oldLabels = this.state.labels;
    this.state.labels = [];
    node.body = this.parseBlock();
    this.state.labels = oldLabels;
    return this.finishNode(node, "DoExpression");
  }

  parseSuper() {
    const node = this.startNode();
    this.next();

    if (this.match(types.parenL) && !this.scope.allowDirectSuper && !this.options.allowSuperOutsideMethod) {
      this.raise(node.start, ErrorMessages.SuperNotAllowed);
    } else if (!this.scope.allowSuper && !this.options.allowSuperOutsideMethod) {
      this.raise(node.start, ErrorMessages.UnexpectedSuper);
    }

    if (!this.match(types.parenL) && !this.match(types.bracketL) && !this.match(types.dot)) {
      this.raise(node.start, ErrorMessages.UnsupportedSuper);
    }

    return this.finishNode(node, "Super");
  }

  parseBooleanLiteral() {
    const node = this.startNode();
    node.value = this.match(types._true);
    this.next();
    return this.finishNode(node, "BooleanLiteral");
  }

  parseMaybePrivateName(isPrivateNameAllowed) {
    const isPrivate = this.match(types.hash);

    if (isPrivate) {
      this.expectOnePlugin(["classPrivateProperties", "classPrivateMethods"]);

      if (!isPrivateNameAllowed) {
        this.raise(this.state.pos, ErrorMessages.UnexpectedPrivateField);
      }

      const node = this.startNode();
      this.next();
      this.assertNoSpace("Unexpected space between # and identifier");
      node.id = this.parseIdentifier(true);
      return this.finishNode(node, "PrivateName");
    } else {
      return this.parseIdentifier(true);
    }
  }

  parseFunctionOrFunctionSent() {
    const node = this.startNode();
    this.next();

    if (this.prodParam.hasYield && this.match(types.dot)) {
      const meta = this.createIdentifier(this.startNodeAtNode(node), "function");
      this.next();
      return this.parseMetaProperty(node, meta, "sent");
    }

    return this.parseFunction(node);
  }

  parseMetaProperty(node, meta, propertyName) {
    node.meta = meta;

    if (meta.name === "function" && propertyName === "sent") {
      if (this.isContextual(propertyName)) {
        this.expectPlugin("functionSent");
      } else if (!this.hasPlugin("functionSent")) {
        this.unexpected();
      }
    }

    const containsEsc = this.state.containsEsc;
    node.property = this.parseIdentifier(true);

    if (node.property.name !== propertyName || containsEsc) {
      this.raise(node.property.start, ErrorMessages.UnsupportedMetaProperty, meta.name, propertyName);
    }

    return this.finishNode(node, "MetaProperty");
  }

  parseImportMetaProperty(node) {
    const id = this.createIdentifier(this.startNodeAtNode(node), "import");
    this.next();

    if (this.isContextual("meta")) {
      if (!this.inModule) {
        this.raiseWithData(id.start, {
          code: "BABEL_PARSER_SOURCETYPE_MODULE_REQUIRED"
        }, ErrorMessages.ImportMetaOutsideModule);
      }

      this.sawUnambiguousESM = true;
    }

    return this.parseMetaProperty(node, id, "meta");
  }

  parseLiteral(value, type, startPos, startLoc) {
    startPos = startPos || this.state.start;
    startLoc = startLoc || this.state.startLoc;
    const node = this.startNodeAt(startPos, startLoc);
    this.addExtra(node, "rawValue", value);
    this.addExtra(node, "raw", this.input.slice(startPos, this.state.end));
    node.value = value;
    this.next();
    return this.finishNode(node, type);
  }

  parseParenAndDistinguishExpression(canBeArrow) {
    const startPos = this.state.start;
    const startLoc = this.state.startLoc;
    let val;
    this.next();
    this.expressionScope.enter(newArrowHeadScope());
    const oldMaybeInArrowParameters = this.state.maybeInArrowParameters;
    const oldInFSharpPipelineDirectBody = this.state.inFSharpPipelineDirectBody;
    this.state.maybeInArrowParameters = true;
    this.state.inFSharpPipelineDirectBody = false;
    const innerStartPos = this.state.start;
    const innerStartLoc = this.state.startLoc;
    const exprList = [];
    const refExpressionErrors = new ExpressionErrors();
    const refNeedsArrowPos = {
      start: 0
    };
    let first = true;
    let spreadStart;
    let optionalCommaStart;

    while (!this.match(types.parenR)) {
      if (first) {
        first = false;
      } else {
        this.expect(types.comma, refNeedsArrowPos.start || null);

        if (this.match(types.parenR)) {
          optionalCommaStart = this.state.start;
          break;
        }
      }

      if (this.match(types.ellipsis)) {
        const spreadNodeStartPos = this.state.start;
        const spreadNodeStartLoc = this.state.startLoc;
        spreadStart = this.state.start;
        exprList.push(this.parseParenItem(this.parseRestBinding(), spreadNodeStartPos, spreadNodeStartLoc));
        this.checkCommaAfterRest(41);
        break;
      } else {
        exprList.push(this.parseMaybeAssignAllowIn(refExpressionErrors, this.parseParenItem, refNeedsArrowPos));
      }
    }

    const innerEndPos = this.state.lastTokEnd;
    const innerEndLoc = this.state.lastTokEndLoc;
    this.expect(types.parenR);
    this.state.maybeInArrowParameters = oldMaybeInArrowParameters;
    this.state.inFSharpPipelineDirectBody = oldInFSharpPipelineDirectBody;
    let arrowNode = this.startNodeAt(startPos, startLoc);

    if (canBeArrow && this.shouldParseArrow() && (arrowNode = this.parseArrow(arrowNode))) {
      this.expressionScope.validateAsPattern();
      this.expressionScope.exit();
      this.parseArrowExpression(arrowNode, exprList, false);
      return arrowNode;
    }

    this.expressionScope.exit();

    if (!exprList.length) {
      this.unexpected(this.state.lastTokStart);
    }

    if (optionalCommaStart) this.unexpected(optionalCommaStart);
    if (spreadStart) this.unexpected(spreadStart);
    this.checkExpressionErrors(refExpressionErrors, true);
    if (refNeedsArrowPos.start) this.unexpected(refNeedsArrowPos.start);
    this.toReferencedListDeep(exprList, true);

    if (exprList.length > 1) {
      val = this.startNodeAt(innerStartPos, innerStartLoc);
      val.expressions = exprList;
      this.finishNodeAt(val, "SequenceExpression", innerEndPos, innerEndLoc);
    } else {
      val = exprList[0];
    }

    if (!this.options.createParenthesizedExpressions) {
      this.addExtra(val, "parenthesized", true);
      this.addExtra(val, "parenStart", startPos);
      return val;
    }

    const parenExpression = this.startNodeAt(startPos, startLoc);
    parenExpression.expression = val;
    this.finishNode(parenExpression, "ParenthesizedExpression");
    return parenExpression;
  }

  shouldParseArrow() {
    return !this.canInsertSemicolon();
  }

  parseArrow(node) {
    if (this.eat(types.arrow)) {
      return node;
    }
  }

  parseParenItem(node, startPos, startLoc) {
    return node;
  }

  parseNewOrNewTarget() {
    const node = this.startNode();
    this.next();

    if (this.match(types.dot)) {
      const meta = this.createIdentifier(this.startNodeAtNode(node), "new");
      this.next();
      const metaProp = this.parseMetaProperty(node, meta, "target");

      if (!this.scope.inNonArrowFunction && !this.scope.inClass) {
        let error = ErrorMessages.UnexpectedNewTarget;

        if (this.hasPlugin("classProperties")) {
          error += " or class properties";
        }

        this.raise(metaProp.start, error);
      }

      return metaProp;
    }

    return this.parseNew(node);
  }

  parseNew(node) {
    node.callee = this.parseNoCallExpr();

    if (node.callee.type === "Import") {
      this.raise(node.callee.start, ErrorMessages.ImportCallNotNewExpression);
    } else if (this.isOptionalChain(node.callee)) {
      this.raise(this.state.lastTokEnd, ErrorMessages.OptionalChainingNoNew);
    } else if (this.eat(types.questionDot)) {
      this.raise(this.state.start, ErrorMessages.OptionalChainingNoNew);
    }

    this.parseNewArguments(node);
    return this.finishNode(node, "NewExpression");
  }

  parseNewArguments(node) {
    if (this.eat(types.parenL)) {
      const args = this.parseExprList(types.parenR);
      this.toReferencedList(args);
      node.arguments = args;
    } else {
      node.arguments = [];
    }
  }

  parseTemplateElement(isTagged) {
    const elem = this.startNode();

    if (this.state.value === null) {
      if (!isTagged) {
        this.raise(this.state.start + 1, ErrorMessages.InvalidEscapeSequenceTemplate);
      }
    }

    elem.value = {
      raw: this.input.slice(this.state.start, this.state.end).replace(/\r\n?/g, "\n"),
      cooked: this.state.value
    };
    this.next();
    elem.tail = this.match(types.backQuote);
    return this.finishNode(elem, "TemplateElement");
  }

  parseTemplate(isTagged) {
    const node = this.startNode();
    this.next();
    node.expressions = [];
    let curElt = this.parseTemplateElement(isTagged);
    node.quasis = [curElt];

    while (!curElt.tail) {
      this.expect(types.dollarBraceL);
      node.expressions.push(this.parseTemplateSubstitution());
      this.expect(types.braceR);
      node.quasis.push(curElt = this.parseTemplateElement(isTagged));
    }

    this.next();
    return this.finishNode(node, "TemplateLiteral");
  }

  parseTemplateSubstitution() {
    return this.parseExpression();
  }

  parseObjectLike(close, isPattern, isRecord, refExpressionErrors) {
    if (isRecord) {
      this.expectPlugin("recordAndTuple");
    }

    const oldInFSharpPipelineDirectBody = this.state.inFSharpPipelineDirectBody;
    this.state.inFSharpPipelineDirectBody = false;
    const propHash = Object.create(null);
    let first = true;
    const node = this.startNode();
    node.properties = [];
    this.next();

    while (!this.match(close)) {
      if (first) {
        first = false;
      } else {
        this.expect(types.comma);

        if (this.match(close)) {
          this.addExtra(node, "trailingComma", this.state.lastTokStart);
          break;
        }
      }

      const prop = this.parsePropertyDefinition(isPattern, refExpressionErrors);

      if (!isPattern) {
        this.checkProto(prop, isRecord, propHash, refExpressionErrors);
      }

      if (isRecord && !this.isObjectProperty(prop) && prop.type !== "SpreadElement") {
        this.raise(prop.start, ErrorMessages.InvalidRecordProperty);
      }

      if (prop.shorthand) {
        this.addExtra(prop, "shorthand", true);
      }

      node.properties.push(prop);
    }

    this.state.exprAllowed = false;
    this.next();
    this.state.inFSharpPipelineDirectBody = oldInFSharpPipelineDirectBody;
    let type = "ObjectExpression";

    if (isPattern) {
      type = "ObjectPattern";
    } else if (isRecord) {
      type = "RecordExpression";
    }

    return this.finishNode(node, type);
  }

  maybeAsyncOrAccessorProp(prop) {
    return !prop.computed && prop.key.type === "Identifier" && (this.isLiteralPropertyName() || this.match(types.bracketL) || this.match(types.star));
  }

  parsePropertyDefinition(isPattern, refExpressionErrors) {
    let decorators = [];

    if (this.match(types.at)) {
      if (this.hasPlugin("decorators")) {
        this.raise(this.state.start, ErrorMessages.UnsupportedPropertyDecorator);
      }

      while (this.match(types.at)) {
        decorators.push(this.parseDecorator());
      }
    }

    const prop = this.startNode();
    let isGenerator = false;
    let isAsync = false;
    let isAccessor = false;
    let startPos;
    let startLoc;

    if (this.match(types.ellipsis)) {
      if (decorators.length) this.unexpected();

      if (isPattern) {
        this.next();
        prop.argument = this.parseIdentifier();
        this.checkCommaAfterRest(125);
        return this.finishNode(prop, "RestElement");
      }

      return this.parseSpread();
    }

    if (decorators.length) {
      prop.decorators = decorators;
      decorators = [];
    }

    prop.method = false;

    if (isPattern || refExpressionErrors) {
      startPos = this.state.start;
      startLoc = this.state.startLoc;
    }

    if (!isPattern) {
      isGenerator = this.eat(types.star);
    }

    const containsEsc = this.state.containsEsc;
    const key = this.parsePropertyName(prop, false);

    if (!isPattern && !isGenerator && !containsEsc && this.maybeAsyncOrAccessorProp(prop)) {
      const keyName = key.name;

      if (keyName === "async" && !this.hasPrecedingLineBreak()) {
        isAsync = true;
        isGenerator = this.eat(types.star);
        this.parsePropertyName(prop, false);
      }

      if (keyName === "get" || keyName === "set") {
        isAccessor = true;
        prop.kind = keyName;

        if (this.match(types.star)) {
          isGenerator = true;
          this.raise(this.state.pos, ErrorMessages.AccessorIsGenerator, keyName);
          this.next();
        }

        this.parsePropertyName(prop, false);
      }
    }

    this.parseObjPropValue(prop, startPos, startLoc, isGenerator, isAsync, isPattern, isAccessor, refExpressionErrors);
    return prop;
  }

  getGetterSetterExpectedParamCount(method) {
    return method.kind === "get" ? 0 : 1;
  }

  getObjectOrClassMethodParams(method) {
    return method.params;
  }

  checkGetterSetterParams(method) {
    var _params;

    const paramCount = this.getGetterSetterExpectedParamCount(method);
    const params = this.getObjectOrClassMethodParams(method);
    const start = method.start;

    if (params.length !== paramCount) {
      if (method.kind === "get") {
        this.raise(start, ErrorMessages.BadGetterArity);
      } else {
        this.raise(start, ErrorMessages.BadSetterArity);
      }
    }

    if (method.kind === "set" && ((_params = params[params.length - 1]) == null ? void 0 : _params.type) === "RestElement") {
      this.raise(start, ErrorMessages.BadSetterRestParameter);
    }
  }

  parseObjectMethod(prop, isGenerator, isAsync, isPattern, isAccessor) {
    if (isAccessor) {
      this.parseMethod(prop, isGenerator, false, false, false, "ObjectMethod");
      this.checkGetterSetterParams(prop);
      return prop;
    }

    if (isAsync || isGenerator || this.match(types.parenL)) {
      if (isPattern) this.unexpected();
      prop.kind = "method";
      prop.method = true;
      return this.parseMethod(prop, isGenerator, isAsync, false, false, "ObjectMethod");
    }
  }

  parseObjectProperty(prop, startPos, startLoc, isPattern, refExpressionErrors) {
    prop.shorthand = false;

    if (this.eat(types.colon)) {
      prop.value = isPattern ? this.parseMaybeDefault(this.state.start, this.state.startLoc) : this.parseMaybeAssignAllowIn(refExpressionErrors);
      return this.finishNode(prop, "ObjectProperty");
    }

    if (!prop.computed && prop.key.type === "Identifier") {
      this.checkReservedWord(prop.key.name, prop.key.start, true, false);

      if (isPattern) {
        prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key.__clone());
      } else if (this.match(types.eq) && refExpressionErrors) {
        if (refExpressionErrors.shorthandAssign === -1) {
          refExpressionErrors.shorthandAssign = this.state.start;
        }

        prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key.__clone());
      } else {
        prop.value = prop.key.__clone();
      }

      prop.shorthand = true;
      return this.finishNode(prop, "ObjectProperty");
    }
  }

  parseObjPropValue(prop, startPos, startLoc, isGenerator, isAsync, isPattern, isAccessor, refExpressionErrors) {
    const node = this.parseObjectMethod(prop, isGenerator, isAsync, isPattern, isAccessor) || this.parseObjectProperty(prop, startPos, startLoc, isPattern, refExpressionErrors);
    if (!node) this.unexpected();
    return node;
  }

  parsePropertyName(prop, isPrivateNameAllowed) {
    if (this.eat(types.bracketL)) {
      prop.computed = true;
      prop.key = this.parseMaybeAssignAllowIn();
      this.expect(types.bracketR);
    } else {
      const oldInPropertyName = this.state.inPropertyName;
      this.state.inPropertyName = true;
      prop.key = this.match(types.num) || this.match(types.string) || this.match(types.bigint) || this.match(types.decimal) ? this.parseExprAtom() : this.parseMaybePrivateName(isPrivateNameAllowed);

      if (!this.isPrivateName(prop.key)) {
        prop.computed = false;
      }

      this.state.inPropertyName = oldInPropertyName;
    }

    return prop.key;
  }

  initFunction(node, isAsync) {
    node.id = null;
    node.generator = false;
    node.async = !!isAsync;
  }

  parseMethod(node, isGenerator, isAsync, isConstructor, allowDirectSuper, type, inClassScope = false) {
    this.initFunction(node, isAsync);
    node.generator = !!isGenerator;
    const allowModifiers = isConstructor;
    this.scope.enter(SCOPE_FUNCTION | SCOPE_SUPER | (inClassScope ? SCOPE_CLASS : 0) | (allowDirectSuper ? SCOPE_DIRECT_SUPER : 0));
    this.prodParam.enter(functionFlags(isAsync, node.generator));
    this.parseFunctionParams(node, allowModifiers);
    this.parseFunctionBodyAndFinish(node, type, true);
    this.prodParam.exit();
    this.scope.exit();
    return node;
  }

  parseArrayLike(close, canBePattern, isTuple, refExpressionErrors) {
    if (isTuple) {
      this.expectPlugin("recordAndTuple");
    }

    const oldInFSharpPipelineDirectBody = this.state.inFSharpPipelineDirectBody;
    this.state.inFSharpPipelineDirectBody = false;
    const node = this.startNode();
    this.next();
    node.elements = this.parseExprList(close, !isTuple, refExpressionErrors, node);
    this.state.inFSharpPipelineDirectBody = oldInFSharpPipelineDirectBody;
    return this.finishNode(node, isTuple ? "TupleExpression" : "ArrayExpression");
  }

  parseArrowExpression(node, params, isAsync, trailingCommaPos) {
    this.scope.enter(SCOPE_FUNCTION | SCOPE_ARROW);
    let flags = functionFlags(isAsync, false);

    if (!this.match(types.bracketL) && this.prodParam.hasIn) {
      flags |= PARAM_IN;
    }

    this.prodParam.enter(flags);
    this.initFunction(node, isAsync);
    const oldMaybeInArrowParameters = this.state.maybeInArrowParameters;

    if (params) {
      this.state.maybeInArrowParameters = true;
      this.setArrowFunctionParameters(node, params, trailingCommaPos);
    }

    this.state.maybeInArrowParameters = false;
    this.parseFunctionBody(node, true);
    this.prodParam.exit();
    this.scope.exit();
    this.state.maybeInArrowParameters = oldMaybeInArrowParameters;
    return this.finishNode(node, "ArrowFunctionExpression");
  }

  setArrowFunctionParameters(node, params, trailingCommaPos) {
    node.params = this.toAssignableList(params, trailingCommaPos, false);
  }

  parseFunctionBodyAndFinish(node, type, isMethod = false) {
    this.parseFunctionBody(node, false, isMethod);
    this.finishNode(node, type);
  }

  parseFunctionBody(node, allowExpression, isMethod = false) {
    const isExpression = allowExpression && !this.match(types.braceL);
    this.expressionScope.enter(newExpressionScope());

    if (isExpression) {
      node.body = this.parseMaybeAssign();
      this.checkParams(node, false, allowExpression, false);
    } else {
      const oldStrict = this.state.strict;
      const oldLabels = this.state.labels;
      this.state.labels = [];
      this.prodParam.enter(this.prodParam.currentFlags() | PARAM_RETURN);
      node.body = this.parseBlock(true, false, hasStrictModeDirective => {
        const nonSimple = !this.isSimpleParamList(node.params);

        if (hasStrictModeDirective && nonSimple) {
          const errorPos = (node.kind === "method" || node.kind === "constructor") && !!node.key ? node.key.end : node.start;
          this.raise(errorPos, ErrorMessages.IllegalLanguageModeDirective);
        }

        const strictModeChanged = !oldStrict && this.state.strict;
        this.checkParams(node, !this.state.strict && !allowExpression && !isMethod && !nonSimple, allowExpression, strictModeChanged);

        if (this.state.strict && node.id) {
          this.checkLVal(node.id, "function name", BIND_OUTSIDE, undefined, undefined, strictModeChanged);
        }
      });
      this.prodParam.exit();
      this.expressionScope.exit();
      this.state.labels = oldLabels;
    }
  }

  isSimpleParamList(params) {
    for (let i = 0, len = params.length; i < len; i++) {
      if (params[i].type !== "Identifier") return false;
    }

    return true;
  }

  checkParams(node, allowDuplicates, isArrowFunction, strictModeChanged = true) {
    const checkClashes = new Set();

    for (let _i2 = 0, _node$params = node.params; _i2 < _node$params.length; _i2++) {
      const param = _node$params[_i2];
      this.checkLVal(param, "function parameter list", BIND_VAR, allowDuplicates ? null : checkClashes, undefined, strictModeChanged);
    }
  }

  parseExprList(close, allowEmpty, refExpressionErrors, nodeForExtra) {
    const elts = [];
    let first = true;

    while (!this.eat(close)) {
      if (first) {
        first = false;
      } else {
        this.expect(types.comma);

        if (this.match(close)) {
          if (nodeForExtra) {
            this.addExtra(nodeForExtra, "trailingComma", this.state.lastTokStart);
          }

          this.next();
          break;
        }
      }

      elts.push(this.parseExprListItem(allowEmpty, refExpressionErrors));
    }

    return elts;
  }

  parseExprListItem(allowEmpty, refExpressionErrors, refNeedsArrowPos, allowPlaceholder) {
    let elt;

    if (this.match(types.comma)) {
      if (!allowEmpty) {
        this.raise(this.state.pos, ErrorMessages.UnexpectedToken, ",");
      }

      elt = null;
    } else if (this.match(types.ellipsis)) {
      const spreadNodeStartPos = this.state.start;
      const spreadNodeStartLoc = this.state.startLoc;
      elt = this.parseParenItem(this.parseSpread(refExpressionErrors, refNeedsArrowPos), spreadNodeStartPos, spreadNodeStartLoc);
    } else if (this.match(types.question)) {
      this.expectPlugin("partialApplication");

      if (!allowPlaceholder) {
        this.raise(this.state.start, ErrorMessages.UnexpectedArgumentPlaceholder);
      }

      const node = this.startNode();
      this.next();
      elt = this.finishNode(node, "ArgumentPlaceholder");
    } else {
      elt = this.parseMaybeAssignAllowIn(refExpressionErrors, this.parseParenItem, refNeedsArrowPos);
    }

    return elt;
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
    } else if (type.keyword) {
      name = type.keyword;
      const curContext = this.curContext();

      if ((type === types._class || type === types._function) && (curContext === types$1.functionStatement || curContext === types$1.functionExpression)) {
        this.state.context.pop();
      }
    } else {
      throw this.unexpected();
    }

    if (liberal) {
      this.state.type = types.name;
    } else {
      this.checkReservedWord(name, start, !!type.keyword, false);
    }

    this.next();
    return name;
  }

  checkReservedWord(word, startLoc, checkKeywords, isBinding) {
    if (this.prodParam.hasYield && word === "yield") {
      this.raise(startLoc, ErrorMessages.YieldBindingIdentifier);
      return;
    }

    if (word === "await") {
      if (this.prodParam.hasAwait) {
        this.raise(startLoc, ErrorMessages.AwaitBindingIdentifier);
        return;
      } else {
        this.expressionScope.recordAsyncArrowParametersError(startLoc, ErrorMessages.AwaitBindingIdentifier);
      }
    }

    if (this.scope.inClass && !this.scope.inNonArrowFunction && word === "arguments") {
      this.raise(startLoc, ErrorMessages.ArgumentsInClass);
      return;
    }

    if (checkKeywords && isKeyword(word)) {
      this.raise(startLoc, ErrorMessages.UnexpectedKeyword, word);
      return;
    }

    const reservedTest = !this.state.strict ? isReservedWord : isBinding ? isStrictBindReservedWord : isStrictReservedWord;

    if (reservedTest(word, this.inModule)) {
      if (!this.prodParam.hasAwait && word === "await") {
        this.raise(startLoc, this.hasPlugin("topLevelAwait") ? ErrorMessages.AwaitNotInAsyncContext : ErrorMessages.AwaitNotInAsyncFunction);
      } else {
        this.raise(startLoc, ErrorMessages.UnexpectedReservedWord, word);
      }
    }
  }

  isAwaitAllowed() {
    if (this.prodParam.hasAwait) return true;

    if (this.options.allowAwaitOutsideFunction && !this.scope.inFunction) {
      return true;
    }

    return false;
  }

  parseAwait() {
    const node = this.startNode();
    this.next();
    this.expressionScope.recordParameterInitializerError(node.start, ErrorMessages.AwaitExpressionFormalParameter);

    if (this.eat(types.star)) {
      this.raise(node.start, ErrorMessages.ObsoleteAwaitStar);
    }

    if (!this.scope.inFunction && !this.options.allowAwaitOutsideFunction) {
      if (this.hasPrecedingLineBreak() || this.match(types.plusMin) || this.match(types.parenL) || this.match(types.bracketL) || this.match(types.backQuote) || this.match(types.regexp) || this.match(types.slash) || this.hasPlugin("v8intrinsic") && this.match(types.modulo)) {
        this.ambiguousScriptDifferentAst = true;
      } else {
        this.sawUnambiguousESM = true;
      }
    }

    if (!this.state.soloAwait) {
      node.argument = this.parseMaybeUnary();
    }

    return this.finishNode(node, "AwaitExpression");
  }

  parseYield() {
    const node = this.startNode();
    this.expressionScope.recordParameterInitializerError(node.start, ErrorMessages.YieldInParameter);
    this.next();

    if (this.match(types.semi) || !this.match(types.star) && !this.state.type.startsExpr || this.hasPrecedingLineBreak()) {
      node.delegate = false;
      node.argument = null;
    } else {
      node.delegate = this.eat(types.star);
      node.argument = this.parseMaybeAssign();
    }

    return this.finishNode(node, "YieldExpression");
  }

  checkPipelineAtInfixOperator(left, leftStartPos) {
    if (this.getPluginOption("pipelineOperator", "proposal") === "smart") {
      if (left.type === "SequenceExpression") {
        this.raise(leftStartPos, ErrorMessages.PipelineHeadSequenceExpression);
      }
    }
  }

  parseSmartPipelineBody(childExpression, startPos, startLoc) {
    this.checkSmartPipelineBodyEarlyErrors(childExpression, startPos);
    return this.parseSmartPipelineBodyInStyle(childExpression, startPos, startLoc);
  }

  checkSmartPipelineBodyEarlyErrors(childExpression, startPos) {
    if (this.match(types.arrow)) {
      throw this.raise(this.state.start, ErrorMessages.PipelineBodyNoArrow);
    } else if (childExpression.type === "SequenceExpression") {
      this.raise(startPos, ErrorMessages.PipelineBodySequenceExpression);
    }
  }

  parseSmartPipelineBodyInStyle(childExpression, startPos, startLoc) {
    const bodyNode = this.startNodeAt(startPos, startLoc);
    const isSimpleReference = this.isSimpleReference(childExpression);

    if (isSimpleReference) {
      bodyNode.callee = childExpression;
    } else {
      if (!this.topicReferenceWasUsedInCurrentTopicContext()) {
        this.raise(startPos, ErrorMessages.PipelineTopicUnused);
      }

      bodyNode.expression = childExpression;
    }

    return this.finishNode(bodyNode, isSimpleReference ? "PipelineBareFunction" : "PipelineTopicExpression");
  }

  isSimpleReference(expression) {
    switch (expression.type) {
      case "MemberExpression":
        return !expression.computed && this.isSimpleReference(expression.object);

      case "Identifier":
        return true;

      default:
        return false;
    }
  }

  withTopicPermittingContext(callback) {
    const outerContextTopicState = this.state.topicContext;
    this.state.topicContext = {
      maxNumOfResolvableTopics: 1,
      maxTopicIndex: null
    };

    try {
      return callback();
    } finally {
      this.state.topicContext = outerContextTopicState;
    }
  }

  withTopicForbiddingContext(callback) {
    const outerContextTopicState = this.state.topicContext;
    this.state.topicContext = {
      maxNumOfResolvableTopics: 0,
      maxTopicIndex: null
    };

    try {
      return callback();
    } finally {
      this.state.topicContext = outerContextTopicState;
    }
  }

  withSoloAwaitPermittingContext(callback) {
    const outerContextSoloAwaitState = this.state.soloAwait;
    this.state.soloAwait = true;

    try {
      return callback();
    } finally {
      this.state.soloAwait = outerContextSoloAwaitState;
    }
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

  disallowInAnd(callback) {
    const flags = this.prodParam.currentFlags();
    const prodParamToClear = PARAM_IN & flags;

    if (prodParamToClear) {
      this.prodParam.enter(flags & ~PARAM_IN);

      try {
        return callback();
      } finally {
        this.prodParam.exit();
      }
    }

    return callback();
  }

  registerTopicReference() {
    this.state.topicContext.maxTopicIndex = 0;
  }

  primaryTopicReferenceIsAllowedInCurrentTopicContext() {
    return this.state.topicContext.maxNumOfResolvableTopics >= 1;
  }

  topicReferenceWasUsedInCurrentTopicContext() {
    return this.state.topicContext.maxTopicIndex != null && this.state.topicContext.maxTopicIndex >= 0;
  }

  parseFSharpPipelineBody(prec) {
    const startPos = this.state.start;
    const startLoc = this.state.startLoc;
    this.state.potentialArrowAt = this.state.start;
    const oldInFSharpPipelineDirectBody = this.state.inFSharpPipelineDirectBody;
    this.state.inFSharpPipelineDirectBody = true;
    const ret = this.parseExprOp(this.parseMaybeUnary(), startPos, startLoc, prec);
    this.state.inFSharpPipelineDirectBody = oldInFSharpPipelineDirectBody;
    return ret;
  }
}