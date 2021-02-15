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
    }
  }
  match(type) {
    return this.state.type === type;
  }
  curContext() {
    return this.state.context[this.state.context.length - 1];
  }
  nextToken() {
    // console.log( 'this.input:', this.input )
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
    // console.log( 'this.state.type:', this.state.type )
    const override = curContext == null ? void 0 : curContext.override;
    if (override) {
    } else {
      // console.log( 'this.state.type:', this.state.type )
      // console.log( 'this.input.codePointAt(this.state.pos):', this.input.codePointAt(this.state.pos) )
      // console.log( this.state.pos , this.input[this.state.pos] )
      this.getTokenFromCode(this.input.codePointAt(this.state.pos));
      // console.log( 'this.state.type:', this.state.type )
    }
    // console.log( 'this.state.type:', this.state.type )
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
      // console.log( this.state.pos, this.input[this.state.pos] )
      let val;
      if (_isDigit(code)) {
        val = code - 48;
      } else {
        val = Infinity;
      }
      if (val >= radix) {
        if (this.options.errorRecovery && val <= 9) {
        } else if (forceLen) {
        } else {
          break;
        }
      }
      ++this.state.pos;
      total = total * radix + val;
    }
    return total;
  }
  readNumber(startsWithDot) {
    const start = this.state.pos;
    let isOctal = false;
    if (!startsWithDot && this.readInt(10) === null) {
    }
    const str = this.input.slice(start, this.state.pos).replace(/[_mn]/g, "");
    const val = isOctal ? parseInt(str, 8) : parseFloat(str);
    this.finishToken(types.num, val);
  }
  readWord1() {
    let word = "";
    let chunkStart = this.state.pos;
    while (this.state.pos < this.length) {
      const ch = this.input.codePointAt(this.state.pos);
      // console.log( 'this.input['+this.state.pos+']:', this.input[this.state.pos] )
      if (isIdentifierChar(ch)) {
        this.state.pos += ch <= 0xffff ? 1 : 2;
      } else {
        break;
      }
    }
    return word + this.input.slice(chunkStart, this.state.pos);
  }
  readWord() {
    const word = this.readWord1();
    // console.log( 'word:', word )
    const type = keywords.get(word) || types.name;
    this.finishToken(type, word);
  }
}