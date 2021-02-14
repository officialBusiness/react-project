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
}