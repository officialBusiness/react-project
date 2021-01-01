import React from 'react'
import './RichTextBoxTest.scss'
import { exportTxt } from '../utils.js'

export default class RichTextBoxTest extends React.Component{
	constructor(props) {
		super(props)
		this.toolbarRef = React.createRef()
		this.toolbarCover = false
		this.richTextBoxContaonerRef = React.createRef()
		this.richTextBoxRef = React.createRef()
		this.titleRef = React.createRef()
		this.contentRef = React.createRef()
	}
	UNSAFE_componentWillMount(){

		window.addEventListener('keydown', this.keydown)
	}
	componentWillUnmount(){
		window.removeEventListener('keydown', this.keydown)
	}
	keydown = (function(e){
		// console.log( 'e:', e )
		var keyCode = e.keyCode || e.which || e.charCode,
				ctrlKey = e.ctrlKey || e.metaKey
			if ( ctrlKey ) {
				if ( keyCode === 83 ) {//s
					e.preventDefault()
					// console.log( '内容', this.contentRef.current.innerHTML )
					// console.log( '标题', this.titleRef.current.value )
					if ( !this.titleRef.current.value ) {
						// alert( '请输入标题' )
						console.log( '请输入标题' )
						return 
					}
					exportTxt({
						filename: this.titleRef.current.value,
						str: this.contentRef.current.innerHTML
					})
				}
			}
			// console.log( keyCode )
	}).bind(this)
	command(aCommandName, aShowDefaultUI, aValueArgument){
		document.execCommand(aCommandName, aShowDefaultUI, aValueArgument);
	}
	render(){
		return (
			<div className={'RichTextBoxTest'} >
				<div className={'toolbar rowContainer'}	data-cover={false} ref={this.toolbarRef}>
					<div className={'buttonContainer rowContainer'}>
						<div  className={'button'} onClick={(e)=>{
							this.command('undo')
						}}>
							撤销
						</div>
						<div className={'button'}  onClick={(e)=>{
							this.command('redo')
						}}>
							重做
						</div>
					</div>
				</div>
				<div className={'RichTextBoxContaoner'} ref={this.richTextBoxContaonerRef}
					onScroll={(e)=>{
						// 富文本框覆盖上移被工具条覆盖时的效果
						if ( e.target.scrollTop > 20 && !this.toolbarCover) {
							this.toolbarCover = true
							this.toolbarRef.current.setAttribute( 'data-cover', true )
						}else if ( e.target.scrollTop < 20 && this.toolbarCover ){
							this.toolbarCover = false
							this.toolbarRef.current.setAttribute( 'data-cover', false )
						}
					}}>			
					<div className={'RichTextBox'} ref={this.richTextBoxRef}>
						<textarea
							placeholder={'请输入标题'}
							className={'title'}
							maxLength={'128'}
							ref={this.titleRef}
							onKeyDown={(e)=>{
								var keyCode = e.keyCode || e.which || e.charCode
								if ( keyCode === 13 ) {//回车
									this.contentRef.current.focus()
									e.preventDefault()
								}
							}}>

						</textarea>
						<div className={'content'}
							contentEditable={'true'}
							ref={this.contentRef}>
						</div>
					</div>
				</div>
			</div>
		)
	}
}