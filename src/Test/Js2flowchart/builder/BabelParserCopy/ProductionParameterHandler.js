import { PARAM_AWAIT, PARAM_YIELD, PARAM_RETURN, PARAM_IN } from './Parameter.js'

export default class ProductionParameterHandler {
  constructor() {
    this.stacks = [];
  }

  enter(flags) {
    this.stacks.push(flags);
  }

  exit() {
    this.stacks.pop();
  }

  currentFlags() {
    return this.stacks[this.stacks.length - 1];
  }

  get hasAwait() {
    return (this.currentFlags() & PARAM_AWAIT) > 0;
  }

  get hasYield() {
    return (this.currentFlags() & PARAM_YIELD) > 0;
  }

  get hasReturn() {
    return (this.currentFlags() & PARAM_RETURN) > 0;
  }

  get hasIn() {
    return (this.currentFlags() & PARAM_IN) > 0;
  }

}