

export default class Scope {
  constructor(flags) {
    this.flags = void 0;
    this.var = [];
    this.lexical = [];
    this.functions = [];
    this.flags = flags;
  }

}