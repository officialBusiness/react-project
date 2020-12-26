import React from 'react'
import ReactDOM from 'react-dom'
import Triangle from './Triangle.js'
import './Tree.scss'
import { getSize, Animation } from '../utils.js'

// class Drag extends React.Component{

// 	render(){
// 		return (
// 			<div>

// 			</div>
// 		)
// 	}
// }
class TreeLi extends React.Component{
	constructor(props) {
		super(props);
		let data = props.data
		if ( data.show === undefined ) {
			data.show = false
		}
		this.treeUlRef = React.createRef()
		this.hasChildren = data.children && Array.isArray( data.children ) && data.children.length > 0
	}
	UNSAFE_componentWillMount(){
		this.treeUlDom = ReactDOM.findDOMNode(this.treeUlRef.current)
	}
	render(){
		let { data = {}, level, controlIcon, message } = this.props ,
				iconRef = React.createRef()
		return (
			<li className={'treeLi'}>
				<div className={'rowContainer'}>
					<div className={'treeLiIconContainer columnContainer'}
						style={{
							visibility: this.hasChildren ? 'visible' : 'hidden'
						}}
						onClick={(e)=>{//icon标签点击展开收缩ul
							if ( !this.hasChildren ) {//没有孩子节点，即没有ul，直接返回
								return
							}
							let treeUlDom = ReactDOM.findDOMNode(this.treeUlRef.current),
									height = getSize( treeUlDom ).height,
									ulShow = data.show,
									treeLiIconDom = iconRef.current,
									duration = height * 5
							// 事件最多300ms，300ms以内的话，与ul高度成比例
							duration = duration > 300 ? 300 : duration
							treeLiIconDom.style.transition = 'transform ' + duration + 'ms'
							// ul展开和隐藏动画
							Animation({
								operation: treeUlDom.style,
								from: {
									height: ulShow ? height : 0,
									opacity: ulShow ? 1 : 0 ,
								},
								duration: duration,
								to: {
									height: ulShow ? 0 : height ,
									opacity: ulShow ? 0 : 1 ,
								},
								onStart: (operation, from, to)=>{
									if ( ulShow ) {
										treeUlDom.style.height = height + 'px'
									}else{
										treeUlDom.style.display = 'block'
									}
								},
								onUpdate: (operation, from, to, now)=>{
									operation.height = now.height + 'px'
									operation.opacity = now.opacity
								},
								onComplete: (operation, from, to)=>{
									data.show = !ulShow
									treeUlDom.style.height = null
									if ( ulShow ) {	//已经完全隐藏
										treeUlDom.style.display = 'none'
									}else{	//ul已经完全展开
										treeUlDom.style.opacity = null
									}
								}
							})
							if ( ulShow ) {
								treeLiIconDom.style.transform = `rotate(0deg)`
							}else{
								treeLiIconDom.style.transform = `rotate(90deg)`
							}
						}}>
							<div className={'treeLiIcon rowContainer'} ref={iconRef} style={{
								transform: data.show ? `rotate(90deg)` : `rotate(0deg)`
							}}>{controlIcon}</div>
						</div>
					<div className={'treeLiTitle'}
						onMouseDown={(e)=>{
							console.log( '鼠标点击' )
						}}
						onMouseUp={(e)=>{
							console.log( '鼠标释放' )
						}}
						onMouseMove={(e)=>{
							console.log('鼠标移动')
						}}
						onDragStart={(e)=>{
							console.log( '开始移动' )
						}}
						onDrag={(e)=>{
							console.log( '开始移动' )
							e.preventDefault()
						}}
						onDragEnd={(e)=>{
							console.log( '开始移动' )
						}}
						onDragEnter={(e)=>{
							console.log( '开始移动' )
						}}
						onDragOver={(e)=>{
							console.log( '开始移动' )
							e.preventDefault()
						}}
						onDragLeave={(e)=>{
							console.log( '开始移动' )
						}}>{data.title}</div>
				</div>
				{
					this.hasChildren ?
					<TreeUl ref={this.treeUlRef}
						data={data.children}
						level={level + 1}
						controlIcon={controlIcon}
						show={data.show}
						message={message}/> : null
				}
			</li>
		)
	}
}
class TreeUl extends React.Component{
	render(){
		let { level, show, data=[], controlIcon, message } = this.props
		return (
			<ul
				className={'treeUl'}
				style={{
					paddingLeft: level === 0 ? '0px' : '20px',
					display: show ? 'block' : 'none',
				}}>
				{
					data.map((item, index)=>{
						return (
							<TreeLi
								key={index}
								data={item}
								level={level}
								controlIcon={controlIcon}
								message={message}/>
						)
					})
				}
			</ul>
		)
	}
}

export default function Tree({
	data = [],
	message = {},
	controlIcon = <Triangle direction={'right'} width={3} height={6} />,
}){
	// console.log( data )
	return (
		<div className={'Tree'} onClick={(e)=>{
			// console.log( data )
		}}>
			<TreeUl
				show={true}
				data={data}
				level={0}
				controlIcon={controlIcon}
				message={message}/>
		</div>
	)
}
