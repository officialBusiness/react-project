import React from 'react'
import './RichTextBoxTest.scss'
import { exportTxt } from '../utils.js'

export default class RichTextBoxTest extends React.Component{
	constructor(props) {
		super(props)
		this.toolbarCover = false
		this.richTextBoxContainerDom = null
		this.toolbarDom = null
		this.richTextBoxDom = null
		this.titleDom = null
		this.contentDom = null

		window.RichTextBoxTest = this
	}
	// UNSAFE_componentWillMount(){
	// }
	selection = document.getSelection()
	range(){
		return this.selection.getRangeAt(0)
	}
	componentDidMount(){
		document.addEventListener("selectionchange", this.selectionchange)
		window.addEventListener('keydown', this.keydown)
		// this.range = document.createRange()
		// console.log( 'this.contentDom:', this.contentDom )
		// this.range.selectNode(this.contentDom)
		// this.contentDom.innerHTML = `<p><b>法国国营铁路公司(SNCF)20日承认,</b>新订购的2000列火车因车体过宽，<strong>无法开进国内许多火车站的站台，从而不得不花大笔资金改造站台。</strong>法国国营铁路公司发言人克里斯托夫·皮耶诺埃尔告诉法国新闻电台：“我们发现问题晚了点。<b>我们承认这一失误并为此承担责任。”</b></p><p>测试</p>`
		this.contentDom.innerHTML = `<p id="p1"><b>Hello</b> world!</p>`
		// console.log('this.contentDom:', this.contentDom.children)
		// console.log( this.contentDom.children[0].children )
		// console.log( this.contentDom.children[0].children[0] )
		// let range = document.getSelection().setBaseAndExtent(0)
		// console.log( this.contentDom.children[0].children )
		// console.log( this.contentDom.children[0].childNodes )
		// console.log( this.contentDom.children[1] )
		// this.selection.setBaseAndExtent(
		// 	this.contentDom.children[0].children[0], 0,
		// 	this.contentDom.children[0], 2
		// )
		let range = document.createRange()
		// range.selectNodeContents(this.contentDom.children[0])
		range.setStart(this.contentDom.children[0].children[0].childNodes[0], 1)
		range.setEnd(this.contentDom.children[0].children[0].childNodes[0], 2)
		// range.setStart(this.contentDom, 0)
		// range.setEnd(this.contentDom, 0)
		// range.deleteContents()
		// let span = document.createElement("span")
		// span.style.color = "red"
		// span.appendChild(document.createTextNode("Inserted text"))
		// span.appendChild(range.extractContents())
		// range.insertNode(span)

		// console.log( range )
		// console.log( range.extractContents() )

		// this.range().setStart(this.contentDom.children[0], 2)
		// this.range().setEnd(this.contentDom.children[0], 3)
	}
	getDomTree(dom = this.contentDom){
		let tree = []
		dom.childNodes.forEach((node, index)=>{
			tree[index] = {
				node: node,
				nodeName: node.nodeName,
			}
			if ( node.children && node.children.length > 0 ) {
				tree[index].children = this.getDomTree(node)
			}
		})
		return tree
	}
	test(){
		let range = this.range()
		let span = document.createElement("span")
		span.style.color = "red"
		// span.appendChild(document.createTextNode("Inserted text"))
		span.appendChild(range.extractContents())
		range.insertNode(span)
	}
	componentWillUnmount(){
		document.removeEventListener("selectionchange", this.selectionchange)
		window.removeEventListener('keydown', this.keydown)
	}
	// 获取当前的光标信息
	// selectionchange = (function(e){
	// 	let selection = document.getSelection(),
	// 			// selectedText = selection.toString(),
	// 			// { anchorNode, anchorOffset, focusNode, focusOffset } = selection,
	// 			range = selection.getRangeAt(0)
	// 	// console.log('选区开始的节点:', anchorNode)
	// 	// console.log('起始节点:', anchorOffset)
	// 	// console.log('选区结束的节点:', focusNode)
	// 	// console.log('起始节点:', focusOffset)
	// 	// console.log( 'selectedText:', selectedText )
	// 	console.log('this:', this)
	// 	console.log( 'range:', range )
	// }).bind(this)
	// 鼠标键盘事件
	keydown = (function(e){
		var keyCode = e.keyCode || e.which || e.charCode,
				ctrlKey = e.ctrlKey || e.metaKey
			if ( ctrlKey ) {
				if ( keyCode === 83 ) {//s
					e.preventDefault()
					if ( !this.titleDom.value ) {
						// alert( '请输入标题' )
						console.log( '请输入标题' )
						return 
					}
					exportTxt({
						filename: this.titleDom.value,
						str: this.contentDom.innerHTML
					})
				}
			}
			// console.log( keyCode )
	}).bind(this)
	render(){
		return (
			<div className={'RichTextBoxTest'} >
				<div className={'toolbar rowContainer'}	data-cover={false} ref={(dom)=>{this.toolbarDom=dom}}>
					<div className={'buttonContainer rowContainer'}>
						<div  className={'button'} onClick={(e)=>{
						}}>
							撤销
						</div>
						<div className={'button'}  onClick={(e)=>{
						}}>
							重做
						</div>
					</div>
				</div>
				<div className={'RichTextBoxContaoner'} ref={(dom)=>{this.richTextBoxContainerDom=dom}}
					onScroll={(e)=>{
						// 富文本框覆盖上移被工具条覆盖时的效果
						if ( e.target.scrollTop > 20 && !this.toolbarCover) {
							this.toolbarCover = true
							this.toolbarDom.setAttribute( 'data-cover', true )
						}else if ( e.target.scrollTop < 20 && this.toolbarCover ){
							this.toolbarCover = false
							this.toolbarDom.setAttribute( 'data-cover', false )
						}
					}}>			
					<div className={'RichTextBox'} ref={(dom)=>{this.richTextBoxDom=dom}}>
						<textarea
							placeholder={'请输入标题'}
							className={'title'}
							maxLength={'128'}
							ref={(dom)=>{this.titleDom=dom}}
							onKeyDown={(e)=>{
								var keyCode = e.keyCode || e.which || e.charCode
								if ( keyCode === 13 ) {//回车
									this.contentDom.focus()
									e.preventDefault()
								}
							}}>

						</textarea>
						<div className={'content'}
							contentEditable={'true'}
							// onSelectionchange={(e)=>{
							// 	console.log( 'selectionchange' )
							// }}
							ref={(dom)=>{this.contentDom=dom}}>

						</div>
					</div>
				</div>
			</div>
		)
	}
}