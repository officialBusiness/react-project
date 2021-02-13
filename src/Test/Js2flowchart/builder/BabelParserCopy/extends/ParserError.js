import CommentsParser from './CommentsParser.js'
import { getLineInfo } from '../Parameter.js'

export default class ParserError extends CommentsParser {
  getLocationForPosition(pos) {
    let loc;
    if (pos === this.state.start) loc = this.state.startLoc;else if (pos === this.state.lastTokStart) loc = this.state.lastTokStartLoc;else if (pos === this.state.end) loc = this.state.endLoc;else if (pos === this.state.lastTokEnd) loc = this.state.lastTokEndLoc;else loc = getLineInfo(this.input, pos);
    return loc;
  }

  raise(pos, errorTemplate, ...params) {
    return this.raiseWithData(pos, undefined, errorTemplate, ...params);
  }

  raiseWithData(pos, data, errorTemplate, ...params) {
    const loc = this.getLocationForPosition(pos);
    const message = errorTemplate.replace(/%(\d+)/g, (_, i) => params[i]) + ` (${loc.line}:${loc.column})`;
    return this._raise(Object.assign({
      loc,
      pos
    }, data), message);
  }

  _raise(errorContext, message) {
    const err = new SyntaxError(message);
    Object.assign(err, errorContext);

    if (this.options.errorRecovery) {
      if (!this.isLookahead) this.state.errors.push(err);
      return err;
    } else {
      throw err;
    }
  }
}