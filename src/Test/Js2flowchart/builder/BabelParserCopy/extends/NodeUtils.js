import UtilParser from './UtilParser.js'
import Node from '../Node.js'

export default class NodeUtils extends UtilParser {
  startNode() {
    // console.log( 'this.state:', this.state )
    // console.log( 'this.state.start:', this.state.start )
    // console.log( 'this.state.startLoc:', this.state.startLoc )
    return new Node(this, this.state.start, this.state.startLoc);
  }
  startNodeAt(pos, loc) {
    return new Node(this, pos, loc);
  }
  finishNode(node, type) {
    return this.finishNodeAt(node, type, this.state.lastTokEnd, this.state.lastTokEndLoc);
  }
  finishNodeAt(node, type, pos, loc) {

    node.type = type;
    node.end = pos;
    node.loc.end = loc;
    if (this.options.ranges) node.range[1] = pos;
    this.processComment(node);
    return node;
  }
}