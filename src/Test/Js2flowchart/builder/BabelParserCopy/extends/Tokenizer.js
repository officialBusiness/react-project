import types from '../types.js'
import types$1 from '../types$1.js'
import { isInAstralSet, astralIdentifierStartCodes, Token, _isDigit, forbiddenNumericSeparatorSiblings, VALID_REGEX_FLAGS, lineBreak,nonASCIIidentifierStart, allowedNumericSeparatorSiblings, keywords, isIdentifierChar, isWhitespace, skipWhiteSpace , SourceLocation, lineBreakG, isNewLine } from '../Parameter.js'

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
export default class Tokenizer{
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
      // console.log( 'types.eof:', types.eof )
      this.finishToken(types.eof);
      return;
    }
    const override = curContext == null ? void 0 : curContext.override;

    if (override) {
    } else {
      // console.log( 'this.input.codePointAt(this.state.pos):', this.input.codePointAt(this.state.pos) )
      // console.log( this.state.pos , this.input[this.state.pos] )
      this.getTokenFromCode(this.input.codePointAt(this.state.pos));
    }
  }
  skipSpace() {
    loop: while (this.state.pos < this.length) {
      // console.log( 'this.state.pos:', this.state.pos )
      const ch = this.input.charCodeAt(this.state.pos);
      // console.log( 'ch:', ch )
      // console.log( 'code['+this.state.pos+']:', this.input[this.state.pos] )
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
    switch (code) {
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
      case 61:
      case 33:
        this.readToken_eq_excl(code);
        return;
      default:
        if (isIdentifierStart(code)) {
          this.readWord();
          return;
        }
    }
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
          // this.raise(this.state.start + i + 2, ErrorMessages.InvalidDigit, radix);
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
      // this.raise(start, ErrorMessages.InvalidNumber);
    }
    const hasLeadingZero = this.state.pos - start >= 2 && this.input.charCodeAt(start) === 48;
    if (hasLeadingZero) {
      const integer = this.input.slice(start, this.state.pos);
      // this.recordStrictModeErrors(start, ErrorMessages.StrictOctalLiteral);

      if (!this.state.strict) {
        const underscorePos = integer.indexOf("_");

        if (underscorePos > 0) {
          // this.raise(underscorePos + start, ErrorMessages.ZeroDigitNumericSeparator);
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
        // this.raise(start, ErrorMessages.InvalidOrMissingExponent);
      }

      isFloat = true;
      hasExponent = true;
      next = this.input.charCodeAt(this.state.pos);
    }

    if (next === 110) {
      if (isFloat || hasLeadingZero) {
        // this.raise(start, ErrorMessages.InvalidBigIntLiteral);
      }

      ++this.state.pos;
      isBigInt = true;
    }

    if (next === 109) {
      this.expectPlugin("decimal", this.state.pos);

      if (hasExponent || hasLeadingZero) {
        // this.raise(start, ErrorMessages.InvalidDecimal);
      }

      ++this.state.pos;
      isDecimal = true;
    }

    if (isIdentifierStart(this.input.codePointAt(this.state.pos))) {
      // throw this.raise(this.state.pos, ErrorMessages.NumberIdentifier);
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

        ++this.state.pos;
        const esc = this.readCodePoint(true);

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
    this.finishToken(type, word);
  }
  checkKeywordEscapes() {
    // const kw = this.state.type.keyword;
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