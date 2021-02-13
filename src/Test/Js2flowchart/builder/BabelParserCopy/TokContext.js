

export default class TokContext {
  constructor(token, isExpr, preserveSpace, override) {
    this.token = void 0;
    this.isExpr = void 0;
    this.preserveSpace = void 0;
    this.override = void 0;
    this.token = token;
    this.isExpr = !!isExpr;
    this.preserveSpace = !!preserveSpace;
    this.override = override;
  }

}