
// 获取display为none的dom的宽高位置
export function getSize(dom, display){
  let backup = {
    position: dom.style.position,
    visibility: dom.style.visibility,
    display: dom.style.display,
  }
  dom.style.position = 'absolute'
  dom.style.visibility = 'hidden'
  if ( display ) {
    dom.style.display = display
  } else{
    dom.style.display = 'block'
  }
  let attr = {
    height: dom.offsetHeight,
    width: dom.offsetWidth,
    offsetLeft: dom.offsetLeft,
    offsetTop: dom.offsetTop
  }
  dom.style.position = backup.position
  dom.style.visibility = backup.visibility
  dom.style.display = backup.display
  return attr
}
// 获取当前时间
export const now$1 = window.performance.now.bind(window.performance)
// 深拷贝一个对象
export function clone(obj){
	var ret = {}
	for(var key in obj){
		if ( typeof obj[key] === 'object' ) {
			ret[key] = clone(obj[key])
		}else{
			ret[key] = obj[key]
		}
	}
	return ret
}
// 简单的动画变化函数，需要占用对象的isAnnmating属性进行判断是否在进行动画，在进行的话，直接返回
export function Animation({
	operation = {},
	from = {},
	to = {},
	duration = 1000,
	onStart = ()=>{},
	onUpdate = ()=>{},
	onComplete = ()=>{},
}){
	if ( operation.isAnimating ) {
		return
	}
	onStart({operation, from, to})
	operation.isAnimating = true
	var startTime = now$1(),
			endTime = startTime + duration,
			now = {}

	// initObject(tempObj, to)
	now = clone(to)
	var animationId = requestAnimationFrame(doAnimation)
	function doAnimation(time){
		var percentage = (time <= startTime ? 0 : time >= endTime ? 1 : (time - startTime) / duration)
		updateProperties( from, to, now, percentage )
		onUpdate({ operation, from, to, now })
		if ( percentage === 1 ) {
			cancelAnimationFrame(animationId)
			onComplete({operation, from, to})
			operation.isAnimating = false
		}else{
			animationId = requestAnimationFrame(doAnimation)
		}
	}
  return function(){
    cancelAnimationFrame(animationId)
  }
}

function updateProperties(from, to, object, percentage){
	for( var key in to ){
		if ( typeof to[key] === 'object' ) {
			updateProperties( from[key], to[key], object[key], percentage )
		}else if ( typeof to[key] === 'number' ) {
			object[key] = (to[key] - from[key]) * percentage + from[key]
		}
	}
}

// 判断是移动端还是PC端
export function browser(){
	var win = false,
			mac = false,
			ipad = false
		// alert(navigator.platform)
		// alert(navigator.userAgent)
		//检测平台  
		var p = navigator.platform
		if ( p.indexOf('mobile') !== -1 ) {
			return 'MOBILE'
		}
		win = p.indexOf("Win") === 0 
		mac = p.indexOf("Mac") === 0
		ipad = (navigator.userAgent.match(/iPad/i) !== null) ? true : false
		// alert(win || mac || ipad)
		if (win || mac || ipad) {
			// alert('PC')
			return 'PC'
		} else {
		// alert('MOBILE')
		var ua = navigator.userAgent.toLowerCase()
		if(ua.match(/MicroMessenger/i) === "micromessenger") {  
		} else {
		}
		return 'MOBILE'
	}
}

//防抖，触发之后推迟n秒执行后再次触发，不断触发不断推迟，（搜索）
export function Debounce( { callback, wait, immediate = false, delayed } ){
	let timer, startTimeStamp = 0, times = 0;
	let args, context;
 
	let run = (timerInterval)=>{
		timer = setTimeout(()=>{
			let now = (new Date()).getTime()
			let interval = now - startTimeStamp
			if(interval < timerInterval){//在n秒内触发了，说明被推迟了
				startTimeStamp = now
				run(wait - interval)
				if ( delayed && typeof delayed === 'function') {// console.log('时间延长')
					delayed( times )
				}
			}else{
				if(!immediate) {
						callback.apply(context, args)
				}
				clearTimeout(timer)
				timer = null
			}
			
		}, timerInterval)
	}
 
	return function(){
		context = this
		args = arguments
		startTimeStamp = (new Date()).getTime()
		if(!timer){
			if(immediate) {
				callback.apply(context, args)
			}
			run(wait)
		}
		
	}
}

//节流，固定时间n秒内函数只会执行一次，多次触发无效（提交）
export function Throttling({ callback, wait, immediate }){
	let timer
	let context, args
 
	let run = () => {
		timer = setTimeout(()=>{
			if( !immediate ){
				callback.apply(context,args)
			}
			clearTimeout(timer)
			timer=null
		}, wait)
	}
	return function () {
		context = this
		args = arguments
		if( !timer ){
			if( immediate ){
				callback.apply(context,args)
			}
			run()
		}
	}
}
// 防抖和节流的最大区别就是不断地触发事件是否会将执行的时间延后

// 
// export function KeyDown(){
// 	var keyCode = e.keyCode || e.which || e.charCode,
// 			ctrlKey = e.ctrlKey || e.metaKey

// }
// window.addEventListener('keydown', keydown)

//js 把字符串保存为txt文件，并下载到本地
export function exportTxt({
	filename, str
}) {
	var urlObject = window.URL || window.webkitURL || window
	var export_blob = new Blob([str])
	var save_link = document.createElementNS("http://www.w3.org/1999/xhtml", "a")
	save_link.href = urlObject.createObjectURL(export_blob)
	save_link.download = filename

	var event = document.createEvent("MouseEvents")
	event.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
	save_link.dispatchEvent(event)
} 