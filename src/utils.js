export function getNoneSize(dom){
	dom.style.cssText = `position:absolute;visibility:hidden;display:block;`
	let attr = {
		height: dom.offsetHeight,
		width: dom.offsetWidth,
		offsetLeft: dom.offsetLeft,
		offsetTop: dom.offsetTop
	}
	return attr
}