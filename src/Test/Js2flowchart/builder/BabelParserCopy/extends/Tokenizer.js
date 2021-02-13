import ParserError from './ParserError.js'
import types from '../types.js'
import types$1 from '../types$1.js'
import { Token, _isDigit, forbiddenNumericSeparatorSiblings, VALID_REGEX_FLAGS, lineBreak, allowedNumericSeparatorSiblings, keywords, isIdentifierChar, isIdentifierStart, isWhitespace, skipWhiteSpace , SourceLocation, lineBreakG, isNewLine } from '../Parameter.js'
import ErrorMessages from '../ErrorMessages.js'

export default class Tokenizer extends ParserError {

  pushToken(token) {
    this.tokens.length = this.state.tokensLength;
    this.tokens.push(token);
    ++this.state.tokensLength;
  }

  next() {
    if (!this.isLookahead) {
      this.checkKeywordEscapes();

      if (this.options.tokens) {
        this.pushToken(new Token(this.state));
      }
    }

    this.state.lastTokEnd = this.state.end;
    this.state.lastTokStart = this.state.start;
    this.state.lastTokEndLoc = this.state.endLoc;
    this.state.lastTokStartLoc = this.state.startLoc;
    this.nextToken();
  }

  eat(type) {
    if (this.match(type)) {
      this.next();
      return true;
    } else {
      return false;
    }
  }

  match(type) {
    return this.state.type === type;
  }

  lookahead() {
    const old = this.state;
    this.state = old.clone(true);
    this.isLookahead = true;
    this.next();
    this.isLookahead = false;
    const curr = this.state;
    this.state = old;
    return curr;
  }

  nextTokenStart() {
    return this.nextTokenStartSince(this.state.pos);
  }

  nextTokenStartSince(pos) {
    skipWhiteSpace.lastIndex = pos;
    const skip = skipWhiteSpace.exec(this.input);
    return pos + skip[0].length;
  }

  lookaheadCharCode() {
    return this.input.charCodeAt(this.nextTokenStart());
  }

  setStrict(strict) {
    this.state.strict = strict;

    if (strict) {
      this.state.strictErrors.forEach((message, pos) => this.raise(pos, message));
      this.state.strictErrors.clear();
    }
  }

  curContext() {
    return this.state.context[this.state.context.length - 1];
  }

  nextToken() {
    const curContext = this.curContext();
    if (!(curContext == null ? void 0 : curContext.preserveSpace)) this.skipSpace();
    this.state.start = this.state.pos;
    this.state.startLoc = this.state.curPosition();

    if (this.state.pos >= this.length) {
      this.finishToken(types.eof);
      return;
    }

    const override = curContext == null ? void 0 : curContext.override;

    if (override) {
      override(this);
    } else {
      this.getTokenFromCode(this.input.codePointAt(this.state.pos));
    }
  }

  pushComment(block, text, start, end, startLoc, endLoc) {
    const comment = {
      type: block ? "CommentBlock" : "CommentLine",
      value: text,
      start: start,
      end: end,
      loc: new SourceLocation(startLoc, endLoc)
    };
    if (this.options.tokens) this.pushToken(comment);
    this.state.comments.push(comment);
    this.addComment(comment);
  }

  skipBlockComment() {
    const startLoc = this.state.curPosition();
    const start = this.state.pos;
    const end = this.input.indexOf("*/", this.state.pos + 2);
    if (end === -1) throw this.raise(start, ErrorMessages.UnterminatedComment);
    this.state.pos = end + 2;
    lineBreakG.lastIndex = start;
    let match;

    while ((match = lineBreakG.exec(this.input)) && match.index < this.state.pos) {
      ++this.state.curLine;
      this.state.lineStart = match.index + match[0].length;
    }

    if (this.isLookahead) return;
    this.pushComment(true, this.input.slice(start + 2, end), start, this.state.pos, startLoc, this.state.curPosition());
  }

  skipLineComment(startSkip) {
    const start = this.state.pos;
    const startLoc = this.state.curPosition();
    let ch = this.input.charCodeAt(this.state.pos += startSkip);

    if (this.state.pos < this.length) {
      while (!isNewLine(ch) && ++this.state.pos < this.length) {
        ch = this.input.charCodeAt(this.state.pos);
      }
    }

    if (this.isLookahead) return;
    this.pushComment(false, this.input.slice(start + startSkip, this.state.pos), start, this.state.pos, startLoc, this.state.curPosition());
  }

  skipSpace() {
    loop: while (this.state.pos < this.length) {
      const ch = this.input.charCodeAt(this.state.pos);

      switch (ch) {
        case 32:
        case 160:
        case 9:
          ++this.state.pos;
          break;

        case 13:
          if (this.input.charCodeAt(this.state.pos + 1) === 10) {
            ++this.state.pos;
          }

        case 10:
        case 8232:
        case 8233:
          ++this.state.pos;
          ++this.state.curLine;
          this.state.lineStart = this.state.pos;
          break;

        case 47:
          switch (this.input.charCodeAt(this.state.pos + 1)) {
            case 42:
              this.skipBlockComment();
              break;

            case 47:
              this.skipLineComment(2);
              break;

            default:
              break loop;
          }

          break;

        default:
          if (isWhitespace(ch)) {
            ++this.state.pos;
          } else {
            break loop;
          }

      }
    }
  }

  finishToken(type, val) {
    this.state.end = this.state.pos;
    this.state.endLoc = this.state.curPosition();
    const prevType = this.state.type;
    this.state.type = type;
    this.state.value = val;
    if (!this.isLookahead) this.updateContext(prevType);
  }

  readToken_numberSign() {
    if (this.state.pos === 0 && this.readToken_interpreter()) {
      return;
    }

    const nextPos = this.state.pos + 1;
    const next = this.input.charCodeAt(nextPos);

    if (next >= 48 && next <= 57) {
      throw this.raise(this.state.pos, ErrorMessages.UnexpectedDigitAfterHash);
    }

    if (next === 123 || next === 91 && this.hasPlugin("recordAndTuple")) {
      this.expectPlugin("recordAndTuple");

      if (this.getPluginOption("recordAndTuple", "syntaxType") !== "hash") {
        throw this.raise(this.state.pos, next === 123 ? ErrorMessages.RecordExpressionHashIncorrectStartSyntaxType : ErrorMessages.TupleExpressionHashIncorrectStartSyntaxType);
      }

      if (next === 123) {
        this.finishToken(types.braceHashL);
      } else {
        this.finishToken(types.bracketHashL);
      }

      this.state.pos += 2;
    } else {
      this.finishOp(types.hash, 1);
    }
  }

  readToken_dot() {
    const next = this.input.charCodeAt(this.state.pos + 1);

    if (next >= 48 && next <= 57) {
      this.readNumber(true);
      return;
    }

    if (next === 46 && this.input.charCodeAt(this.state.pos + 2) === 46) {
      this.state.pos += 3;
      this.finishToken(types.ellipsis);
    } else {
      ++this.state.pos;
      this.finishToken(types.dot);
    }
  }

  readToken_slash() {
    if (this.state.exprAllowed && !this.state.inType) {
      ++this.state.pos;
      this.readRegexp();
      return;
    }

    const next = this.input.charCodeAt(this.state.pos + 1);

    if (next === 61) {
      this.finishOp(types.assign, 2);
    } else {
      this.finishOp(types.slash, 1);
    }
  }

  readToken_interpreter() {
    if (this.state.pos !== 0 || this.length < 2) return false;
    let ch = this.input.charCodeAt(this.state.pos + 1);
    if (ch !== 33) return false;
    const start = this.state.pos;
    this.state.pos += 1;

    while (!isNewLine(ch) && ++this.state.pos < this.length) {
      ch = this.input.charCodeAt(this.state.pos);
    }

    const value = this.input.slice(start + 2, this.state.pos);
    this.finishToken(types.interpreterDirective, value);
    return true;
  }

  readToken_mult_modulo(code) {
    let type = code === 42 ? types.star : types.modulo;
    let width = 1;
    let next = this.input.charCodeAt(this.state.pos + 1);
    const exprAllowed = this.state.exprAllowed;

    if (code === 42 && next === 42) {
      width++;
      next = this.input.charCodeAt(this.state.pos + 2);
      type = types.exponent;
    }

    if (next === 61 && !exprAllowed) {
      width++;
      type = types.assign;
    }

    this.finishOp(type, width);
  }

  readToken_pipe_amp(code) {
    const next = this.input.charCodeAt(this.state.pos + 1);

    if (next === code) {
      if (this.input.charCodeAt(this.state.pos + 2) === 61) {
        this.finishOp(types.assign, 3);
      } else {
        this.finishOp(code === 124 ? types.logicalOR : types.logicalAND, 2);
      }

      return;
    }

    if (code === 124) {
      if (next === 62) {
        this.finishOp(types.pipeline, 2);
        return;
      }

      if (this.hasPlugin("recordAndTuple") && next === 125) {
        if (this.getPluginOption("recordAndTuple", "syntaxType") !== "bar") {
          throw this.raise(this.state.pos, ErrorMessages.RecordExpressionBarIncorrectEndSyntaxType);
        }

        this.finishOp(types.braceBarR, 2);
        return;
      }

      if (this.hasPlugin("recordAndTuple") && next === 93) {
        if (this.getPluginOption("recordAndTuple", "syntaxType") !== "bar") {
          throw this.raise(this.state.pos, ErrorMessages.TupleExpressionBarIncorrectEndSyntaxType);
        }

        this.finishOp(types.bracketBarR, 2);
        return;
      }
    }

    if (next === 61) {
      this.finishOp(types.assign, 2);
      return;
    }

    this.finishOp(code === 124 ? types.bitwiseOR : types.bitwiseAND, 1);
  }

  readToken_caret() {
    const next = this.input.charCodeAt(this.state.pos + 1);

    if (next === 61) {
      this.finishOp(types.assign, 2);
    } else {
      this.finishOp(types.bitwiseXOR, 1);
    }
  }

  readToken_plus_min(code) {
    const next = this.input.charCodeAt(this.state.pos + 1);

    if (next === code) {
      if (next === 45 && !this.inModule && this.input.charCodeAt(this.state.pos + 2) === 62 && (this.state.lastTokEnd === 0 || this.hasPrecedingLineBreak())) {
        this.skipLineComment(3);
        this.skipSpace();
        this.nextToken();
        return;
      }

      this.finishOp(types.incDec, 2);
      return;
    }

    if (next === 61) {
      this.finishOp(types.assign, 2);
    } else {
      this.finishOp(types.plusMin, 1);
    }
  }

  readToken_lt_gt(code) {
    const next = this.input.charCodeAt(this.state.pos + 1);
    let size = 1;

    if (next === code) {
      size = code === 62 && this.input.charCodeAt(this.state.pos + 2) === 62 ? 3 : 2;

      if (this.input.charCodeAt(this.state.pos + size) === 61) {
        this.finishOp(types.assign, size + 1);
        return;
      }

      this.finishOp(types.bitShift, size);
      return;
    }

    if (next === 33 && code === 60 && !this.inModule && this.input.charCodeAt(this.state.pos + 2) === 45 && this.input.charCodeAt(this.state.pos + 3) === 45) {
      this.skipLineComment(4);
      this.skipSpace();
      this.nextToken();
      return;
    }

    if (next === 61) {
      size = 2;
    }

    this.finishOp(types.relational, size);
  }

  readToken_eq_excl(code) {
    const next = this.input.charCodeAt(this.state.pos + 1);

    if (next === 61) {
      this.finishOp(types.equality, this.input.charCodeAt(this.state.pos + 2) === 61 ? 3 : 2);
      return;
    }

    if (code === 61 && next === 62) {
      this.state.pos += 2;
      this.finishToken(types.arrow);
      return;
    }

    this.finishOp(code === 61 ? types.eq : types.bang, 1);
  }

  readToken_question() {
    const next = this.input.charCodeAt(this.state.pos + 1);
    const next2 = this.input.charCodeAt(this.state.pos + 2);

    if (next === 63) {
      if (next2 === 61) {
        this.finishOp(types.assign, 3);
      } else {
        this.finishOp(types.nullishCoalescing, 2);
      }
    } else if (next === 46 && !(next2 >= 48 && next2 <= 57)) {
      this.state.pos += 2;
      this.finishToken(types.questionDot);
    } else {
      ++this.state.pos;
      this.finishToken(types.question);
    }
  }

  getTokenFromCode(code) {
    switch (code) {
      case 46:
        this.readToken_dot();
        return;

      case 40:
        ++this.state.pos;
        this.finishToken(types.parenL);
        return;

      case 41:
        ++this.state.pos;
        this.finishToken(types.parenR);
        return;

      case 59:
        ++this.state.pos;
        this.finishToken(types.semi);
        return;

      case 44:
        ++this.state.pos;
        this.finishToken(types.comma);
        return;

      case 91:
        if (this.hasPlugin("recordAndTuple") && this.input.charCodeAt(this.state.pos + 1) === 124) {
          if (this.getPluginOption("recordAndTuple", "syntaxType") !== "bar") {
            throw this.raise(this.state.pos, ErrorMessages.TupleExpressionBarIncorrectStartSyntaxType);
          }

          this.finishToken(types.bracketBarL);
          this.state.pos += 2;
        } else {
          ++this.state.pos;
          this.finishToken(types.bracketL);
        }

        return;

      case 93:
        ++this.state.pos;
        this.finishToken(types.bracketR);
        return;

      case 123:
        if (this.hasPlugin("recordAndTuple") && this.input.charCodeAt(this.state.pos + 1) === 124) {
          if (this.getPluginOption("recordAndTuple", "syntaxType") !== "bar") {
            throw this.raise(this.state.pos, ErrorMessages.RecordExpressionBarIncorrectStartSyntaxType);
          }

          this.finishToken(types.braceBarL);
          this.state.pos += 2;
        } else {
          ++this.state.pos;
          this.finishToken(types.braceL);
        }

        return;

      case 125:
        ++this.state.pos;
        this.finishToken(types.braceR);
        return;

      case 58:
        if (this.hasPlugin("functionBind") && this.input.charCodeAt(this.state.pos + 1) === 58) {
          this.finishOp(types.doubleColon, 2);
        } else {
          ++this.state.pos;
          this.finishToken(types.colon);
        }

        return;

      case 63:
        this.readToken_question();
        return;

      case 96:
        ++this.state.pos;
        this.finishToken(types.backQuote);
        return;

      case 48:
        {
          const next = this.input.charCodeAt(this.state.pos + 1);

          if (next === 120 || next === 88) {
            this.readRadixNumber(16);
            return;
          }

          if (next === 111 || next === 79) {
            this.readRadixNumber(8);
            return;
          }

          if (next === 98 || next === 66) {
            this.readRadixNumber(2);
            return;
          }
        }

      case 49:
      case 50:
      case 51:
      case 52:
      case 53:
      case 54:
      case 55:
      case 56:
      case 57:
        this.readNumber(false);
        return;

      case 34:
      case 39:
        this.readString(code);
        return;

      case 47:
        this.readToken_slash();
        return;

      case 37:
      case 42:
        this.readToken_mult_modulo(code);
        return;

      case 124:
      case 38:
        this.readToken_pipe_amp(code);
        return;

      case 94:
        this.readToken_caret();
        return;

      case 43:
      case 45:
        this.readToken_plus_min(code);
        return;

      case 60:
      case 62:
        this.readToken_lt_gt(code);
        return;

      case 61:
      case 33:
        this.readToken_eq_excl(code);
        return;

      case 126:
        this.finishOp(types.tilde, 1);
        return;

      case 64:
        ++this.state.pos;
        this.finishToken(types.at);
        return;

      case 35:
        this.readToken_numberSign();
        return;

      case 92:
        this.readWord();
        return;

      default:
        if (isIdentifierStart(code)) {
          this.readWord();
          return;
        }

    }

    throw this.raise(this.state.pos, ErrorMessages.InvalidOrUnexpectedToken, String.fromCodePoint(code));
  }

  finishOp(type, size) {
    const str = this.input.slice(this.state.pos, this.state.pos + size);
    this.state.pos += size;
    this.finishToken(type, str);
  }

  readRegexp() {
    const start = this.state.pos;
    let escaped, inClass;

    for (;;) {
      if (this.state.pos >= this.length) {
        throw this.raise(start, ErrorMessages.UnterminatedRegExp);
      }

      const ch = this.input.charAt(this.state.pos);

      if (lineBreak.test(ch)) {
        throw this.raise(start, ErrorMessages.UnterminatedRegExp);
      }

      if (escaped) {
        escaped = false;
      } else {
        if (ch === "[") {
          inClass = true;
        } else if (ch === "]" && inClass) {
          inClass = false;
        } else if (ch === "/" && !inClass) {
          break;
        }

        escaped = ch === "\\";
      }

      ++this.state.pos;
    }

    const content = this.input.slice(start, this.state.pos);
    ++this.state.pos;
    let mods = "";

    while (this.state.pos < this.length) {
      const char = this.input[this.state.pos];
      const charCode = this.input.codePointAt(this.state.pos);

      if (VALID_REGEX_FLAGS.has(char)) {
        if (mods.indexOf(char) > -1) {
          this.raise(this.state.pos + 1, ErrorMessages.DuplicateRegExpFlags);
        }
      } else if (isIdentifierChar(charCode) || charCode === 92) {
        this.raise(this.state.pos + 1, ErrorMessages.MalformedRegExpFlags);
      } else {
        break;
      }

      ++this.state.pos;
      mods += char;
    }

    this.finishToken(types.regexp, {
      pattern: content,
      flags: mods
    });
  }

  readInt(radix, len, forceLen, allowNumSeparator = true) {
    const start = this.state.pos;
    const forbiddenSiblings = radix === 16 ? forbiddenNumericSeparatorSiblings.hex : forbiddenNumericSeparatorSiblings.decBinOct;
    const allowedSiblings = radix === 16 ? allowedNumericSeparatorSiblings.hex : radix === 10 ? allowedNumericSeparatorSiblings.dec : radix === 8 ? allowedNumericSeparatorSiblings.oct : allowedNumericSeparatorSiblings.bin;
    let invalid = false;
    let total = 0;

    for (let i = 0, e = len == null ? Infinity : len; i < e; ++i) {
      const code = this.input.charCodeAt(this.state.pos);
      let val;

      if (code === 95) {
        const prev = this.input.charCodeAt(this.state.pos - 1);
        const next = this.input.charCodeAt(this.state.pos + 1);

        if (allowedSiblings.indexOf(next) === -1) {
          this.raise(this.state.pos, ErrorMessages.UnexpectedNumericSeparator);
        } else if (forbiddenSiblings.indexOf(prev) > -1 || forbiddenSiblings.indexOf(next) > -1 || Number.isNaN(next)) {
          this.raise(this.state.pos, ErrorMessages.UnexpectedNumericSeparator);
        }

        if (!allowNumSeparator) {
          this.raise(this.state.pos, ErrorMessages.NumericSeparatorInEscapeSequence);
        }

        ++this.state.pos;
        continue;
      }

      if (code >= 97) {
        val = code - 97 + 10;
      } else if (code >= 65) {
        val = code - 65 + 10;
      } else if (_isDigit(code)) {
        val = code - 48;
      } else {
        val = Infinity;
      }

      if (val >= radix) {
        if (this.options.errorRecovery && val <= 9) {
          val = 0;
          this.raise(this.state.start + i + 2, ErrorMessages.InvalidDigit, radix);
        } else if (forceLen) {
          val = 0;
          invalid = true;
        } else {
          break;
        }
      }

      ++this.state.pos;
      total = total * radix + val;
    }

    if (this.state.pos === start || len != null && this.state.pos - start !== len || invalid) {
      return null;
    }

    return total;
  }

  readRadixNumber(radix) {
    const start = this.state.pos;
    let isBigInt = false;
    this.state.pos += 2;
    const val = this.readInt(radix);

    if (val == null) {
      this.raise(this.state.start + 2, ErrorMessages.InvalidDigit, radix);
    }

    const next = this.input.charCodeAt(this.state.pos);

    if (next === 110) {
      ++this.state.pos;
      isBigInt = true;
    } else if (next === 109) {
      throw this.raise(start, ErrorMessages.InvalidDecimal);
    }

    if (isIdentifierStart(this.input.codePointAt(this.state.pos))) {
      throw this.raise(this.state.pos, ErrorMessages.NumberIdentifier);
    }

    if (isBigInt) {
      const str = this.input.slice(start, this.state.pos).replace(/[_n]/g, "");
      this.finishToken(types.bigint, str);
      return;
    }

    this.finishToken(types.num, val);
  }

  readNumber(startsWithDot) {
    const start = this.state.pos;
    let isFloat = false;
    let isBigInt = false;
    let isDecimal = false;
    let hasExponent = false;
    let isOctal = false;

    if (!startsWithDot && this.readInt(10) === null) {
      this.raise(start, ErrorMessages.InvalidNumber);
    }

    const hasLeadingZero = this.state.pos - start >= 2 && this.input.charCodeAt(start) === 48;

    if (hasLeadingZero) {
      const integer = this.input.slice(start, this.state.pos);
      this.recordStrictModeErrors(start, ErrorMessages.StrictOctalLiteral);

      if (!this.state.strict) {
        const underscorePos = integer.indexOf("_");

        if (underscorePos > 0) {
          this.raise(underscorePos + start, ErrorMessages.ZeroDigitNumericSeparator);
        }
      }

      isOctal = hasLeadingZero && !/[89]/.test(integer);
    }

    let next = this.input.charCodeAt(this.state.pos);

    if (next === 46 && !isOctal) {
      ++this.state.pos;
      this.readInt(10);
      isFloat = true;
      next = this.input.charCodeAt(this.state.pos);
    }

    if ((next === 69 || next === 101) && !isOctal) {
      next = this.input.charCodeAt(++this.state.pos);

      if (next === 43 || next === 45) {
        ++this.state.pos;
      }

      if (this.readInt(10) === null) {
        this.raise(start, ErrorMessages.InvalidOrMissingExponent);
      }

      isFloat = true;
      hasExponent = true;
      next = this.input.charCodeAt(this.state.pos);
    }

    if (next === 110) {
      if (isFloat || hasLeadingZero) {
        this.raise(start, ErrorMessages.InvalidBigIntLiteral);
      }

      ++this.state.pos;
      isBigInt = true;
    }

    if (next === 109) {
      this.expectPlugin("decimal", this.state.pos);

      if (hasExponent || hasLeadingZero) {
        this.raise(start, ErrorMessages.InvalidDecimal);
      }

      ++this.state.pos;
      isDecimal = true;
    }

    if (isIdentifierStart(this.input.codePointAt(this.state.pos))) {
      throw this.raise(this.state.pos, ErrorMessages.NumberIdentifier);
    }

    const str = this.input.slice(start, this.state.pos).replace(/[_mn]/g, "");

    if (isBigInt) {
      this.finishToken(types.bigint, str);
      return;
    }

    if (isDecimal) {
      this.finishToken(types.decimal, str);
      return;
    }

    const val = isOctal ? parseInt(str, 8) : parseFloat(str);
    this.finishToken(types.num, val);
  }

  readCodePoint(throwOnInvalid) {
    const ch = this.input.charCodeAt(this.state.pos);
    let code;

    if (ch === 123) {
      const codePos = ++this.state.pos;
      code = this.readHexChar(this.input.indexOf("}", this.state.pos) - this.state.pos, true, throwOnInvalid);
      ++this.state.pos;

      if (code !== null && code > 0x10ffff) {
        if (throwOnInvalid) {
          this.raise(codePos, ErrorMessages.InvalidCodePoint);
        } else {
          return null;
        }
      }
    } else {
      code = this.readHexChar(4, false, throwOnInvalid);
    }

    return code;
  }

  readString(quote) {
    let out = "",
        chunkStart = ++this.state.pos;

    for (;;) {
      if (this.state.pos >= this.length) {
        throw this.raise(this.state.start, ErrorMessages.UnterminatedString);
      }

      const ch = this.input.charCodeAt(this.state.pos);
      if (ch === quote) break;

      if (ch === 92) {
        out += this.input.slice(chunkStart, this.state.pos);
        out += this.readEscapedChar(false);
        chunkStart = this.state.pos;
      } else if (ch === 8232 || ch === 8233) {
        ++this.state.pos;
        ++this.state.curLine;
        this.state.lineStart = this.state.pos;
      } else if (isNewLine(ch)) {
        throw this.raise(this.state.start, ErrorMessages.UnterminatedString);
      } else {
        ++this.state.pos;
      }
    }

    out += this.input.slice(chunkStart, this.state.pos++);
    this.finishToken(types.string, out);
  }

  readTmplToken() {
    let out = "",
        chunkStart = this.state.pos,
        containsInvalid = false;

    for (;;) {
      if (this.state.pos >= this.length) {
        throw this.raise(this.state.start, ErrorMessages.UnterminatedTemplate);
      }

      const ch = this.input.charCodeAt(this.state.pos);

      if (ch === 96 || ch === 36 && this.input.charCodeAt(this.state.pos + 1) === 123) {
        if (this.state.pos === this.state.start && this.match(types.template)) {
          if (ch === 36) {
            this.state.pos += 2;
            this.finishToken(types.dollarBraceL);
            return;
          } else {
            ++this.state.pos;
            this.finishToken(types.backQuote);
            return;
          }
        }

        out += this.input.slice(chunkStart, this.state.pos);
        this.finishToken(types.template, containsInvalid ? null : out);
        return;
      }

      if (ch === 92) {
        out += this.input.slice(chunkStart, this.state.pos);
        const escaped = this.readEscapedChar(true);

        if (escaped === null) {
          containsInvalid = true;
        } else {
          out += escaped;
        }

        chunkStart = this.state.pos;
      } else if (isNewLine(ch)) {
        out += this.input.slice(chunkStart, this.state.pos);
        ++this.state.pos;

        switch (ch) {
          case 13:
            if (this.input.charCodeAt(this.state.pos) === 10) {
              ++this.state.pos;
            }

          case 10:
            out += "\n";
            break;

          default:
            out += String.fromCharCode(ch);
            break;
        }

        ++this.state.curLine;
        this.state.lineStart = this.state.pos;
        chunkStart = this.state.pos;
      } else {
        ++this.state.pos;
      }
    }
  }

  recordStrictModeErrors(pos, message) {
    if (this.state.strict && !this.state.strictErrors.has(pos)) {
      this.raise(pos, message);
    } else {
      this.state.strictErrors.set(pos, message);
    }
  }

  readEscapedChar(inTemplate) {
    const throwOnInvalid = !inTemplate;
    const ch = this.input.charCodeAt(++this.state.pos);
    ++this.state.pos;

    switch (ch) {
      case 110:
        return "\n";

      case 114:
        return "\r";

      case 120:
        {
          const code = this.readHexChar(2, false, throwOnInvalid);
          return code === null ? null : String.fromCharCode(code);
        }

      case 117:
        {
          const code = this.readCodePoint(throwOnInvalid);
          return code === null ? null : String.fromCodePoint(code);
        }

      case 116:
        return "\t";

      case 98:
        return "\b";

      case 118:
        return "\u000b";

      case 102:
        return "\f";

      case 13:
        if (this.input.charCodeAt(this.state.pos) === 10) {
          ++this.state.pos;
        }

      case 10:
        this.state.lineStart = this.state.pos;
        ++this.state.curLine;

      case 8232:
      case 8233:
        return "";

      case 56:
      case 57:
        if (inTemplate) {
          return null;
        } else {
          this.recordStrictModeErrors(this.state.pos - 1, ErrorMessages.StrictNumericEscape);
        }

      default:
        if (ch >= 48 && ch <= 55) {
          const codePos = this.state.pos - 1;
          const match = this.input.substr(this.state.pos - 1, 3).match(/^[0-7]+/);
          let octalStr = match[0];
          let octal = parseInt(octalStr, 8);

          if (octal > 255) {
            octalStr = octalStr.slice(0, -1);
            octal = parseInt(octalStr, 8);
          }

          this.state.pos += octalStr.length - 1;
          const next = this.input.charCodeAt(this.state.pos);

          if (octalStr !== "0" || next === 56 || next === 57) {
            if (inTemplate) {
              return null;
            } else {
              this.recordStrictModeErrors(codePos, ErrorMessages.StrictNumericEscape);
            }
          }

          return String.fromCharCode(octal);
        }

        return String.fromCharCode(ch);
    }
  }

  readHexChar(len, forceLen, throwOnInvalid) {
    const codePos = this.state.pos;
    const n = this.readInt(16, len, forceLen, false);

    if (n === null) {
      if (throwOnInvalid) {
        this.raise(codePos, ErrorMessages.InvalidEscapeSequence);
      } else {
        this.state.pos = codePos - 1;
      }
    }

    return n;
  }

  readWord1() {
    let word = "";
    this.state.containsEsc = false;
    const start = this.state.pos;
    let chunkStart = this.state.pos;

    while (this.state.pos < this.length) {
      const ch = this.input.codePointAt(this.state.pos);

      if (isIdentifierChar(ch)) {
        this.state.pos += ch <= 0xffff ? 1 : 2;
      } else if (this.state.isIterator && ch === 64) {
        ++this.state.pos;
      } else if (ch === 92) {
        this.state.containsEsc = true;
        word += this.input.slice(chunkStart, this.state.pos);
        const escStart = this.state.pos;
        const identifierCheck = this.state.pos === start ? isIdentifierStart : isIdentifierChar;

        if (this.input.charCodeAt(++this.state.pos) !== 117) {
          this.raise(this.state.pos, ErrorMessages.MissingUnicodeEscape);
          continue;
        }

        ++this.state.pos;
        const esc = this.readCodePoint(true);

        if (esc !== null) {
          if (!identifierCheck(esc)) {
            this.raise(escStart, ErrorMessages.EscapedCharNotAnIdentifier);
          }

          word += String.fromCodePoint(esc);
        }

        chunkStart = this.state.pos;
      } else {
        break;
      }
    }

    return word + this.input.slice(chunkStart, this.state.pos);
  }

  isIterator(word) {
    return word === "@@iterator" || word === "@@asyncIterator";
  }

  readWord() {
    const word = this.readWord1();
    const type = keywords.get(word) || types.name;

    if (this.state.isIterator && (!this.isIterator(word) || !this.state.inType)) {
      this.raise(this.state.pos, ErrorMessages.InvalidIdentifier, word);
    }

    this.finishToken(type, word);
  }

  checkKeywordEscapes() {
    const kw = this.state.type.keyword;

    if (kw && this.state.containsEsc) {
      this.raise(this.state.start, ErrorMessages.InvalidEscapedReservedWord, kw);
    }
  }

  braceIsBlock(prevType) {
    const parent = this.curContext();

    if (parent === types$1.functionExpression || parent === types$1.functionStatement) {
      return true;
    }

    if (prevType === types.colon && (parent === types$1.braceStatement || parent === types$1.braceExpression)) {
      return !parent.isExpr;
    }

    if (prevType === types._return || prevType === types.name && this.state.exprAllowed) {
      return this.hasPrecedingLineBreak();
    }

    if (prevType === types._else || prevType === types.semi || prevType === types.eof || prevType === types.parenR || prevType === types.arrow) {
      return true;
    }

    if (prevType === types.braceL) {
      return parent === types$1.braceStatement;
    }

    if (prevType === types._var || prevType === types._const || prevType === types.name) {
      return false;
    }

    if (prevType === types.relational) {
      return true;
    }

    return !this.state.exprAllowed;
  }

  updateContext(prevType) {
    const type = this.state.type;
    let update;

    if (type.keyword && (prevType === types.dot || prevType === types.questionDot)) {
      this.state.exprAllowed = false;
    } else if (update = type.updateContext) {
      update.call(this, prevType);
    } else {
      this.state.exprAllowed = type.beforeExpr;
    }
  }

}