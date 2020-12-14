// 获取display为none的dom的宽高位置
export function getNoneSize(dom){
	dom.style.position = 'absolute'
	dom.style.visibility = 'hidden'
	dom.style.display = 'block'
	let attr = {
		height: dom.offsetHeight,
		width: dom.offsetWidth,
		offsetLeft: dom.offsetLeft,
		offsetTop: dom.offsetTop
	}
	dom.style.position = 'initial'
	dom.style.visibility = 'initial'
	dom.style.display = 'none'
	return attr
}
// 简单的动画变化
export function Animation(){

}
// 转化three的三维位置到浏览器窗口的位置
export function getWindowPositionFromThree(threePosition){
	
}
// 转化浏览器窗口的位置到three的三维位置
export function geThreePositionFromWindow(windowPosition){
	
}
