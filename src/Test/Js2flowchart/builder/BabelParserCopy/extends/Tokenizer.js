import CommentsParser from './CommentsParser.js'
import types from '../types.js'
import types$1 from '../types$1.js'
import { isInAstralSet, astralIdentifierStartCodes, Token, _isDigit, forbiddenNumericSeparatorSiblings, VALID_REGEX_FLAGS, lineBreak,nonASCIIidentifierStart, allowedNumericSeparatorSiblings, keywords, isIdentifierChar, isWhitespace, skipWhiteSpace , SourceLocation, lineBreakG, isNewLine } from '../Parameter.js'
import ErrorMessages from '../ErrorMessages.js'

function isIdentifierStart(code) {
  if (code < 65) return code === 36;
  if (code <= 90) return true;
  if (code < 97) return code === 95;
  if (code <= 122) return true;
  if (code <= 0xffff) {
    return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code));
  }
  return isInAstralSet(code, astralIdentifierStartCodes);
}
export default class Tokenizer  extends CommentsParser{
  // next() {
  //   this.nextToken();
  // }
  eat(type) {
    if (this.match(type)) {
      this.nextToken();
      return true;
    } else {
      return false;
    }
  }
  match(type) {
    return this.state.type === type;
  }
  curContext() {
    return this.state.context[this.state.context.length - 1];
  }
  nextToken() {
    const curContext = this.curContext();
    if (!(curContext == null ? void 0 : curContext.preserveSpace)){
      this.skipSpace();
    }
    this.state.start = this.state.pos;
    this.state.startLoc = this.state.curPosition();
    if (this.state.pos >= this.length) {
      this.finishToken(types.eof);
      return;
    }
    const override = curContext == null ? void 0 : curContext.override;

    if (override) {
    } else {
      this.getTokenFromCode(this.input.codePointAt(this.state.pos));
    }
  }
  skipSpace() {
    loop: while (this.state.pos < this.length) {
      // console.log( 'this.state.pos:', this.state.pos )
      const ch = this.input.charCodeAt(this.state.pos);
      // console.log( 'ch:', ch )
      // console.log( this.input[this.state.pos] )
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
    if (!this.isLookahead) {
      this.updateContext(prevType)
    }
  }
  readToken_eq_excl(code) {
    const next = this.input.charCodeAt(this.state.pos + 1);
    // console.log( 'next:', next )
    // console.log( this.input[this.state.pos] )
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
  getTokenFromCode(code) {
    // console.log( 'code:', code )
    switch (code) {
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
      case 63:
        this.readToken_question();
        return;
      case 96:
        ++this.state.pos;
        this.finishToken(types.backQuote);
        return;
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