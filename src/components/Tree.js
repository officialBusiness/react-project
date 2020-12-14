import React from 'react'
import ReactDOM from 'react-dom'
import Triangle from './Triangle.js'
import './Tree.scss'
import { getSize, Animation } from '../utils.js'

class TreeLi extends React.Component{
	constructor(props) {
		super(props);
		let data = props.data
		if ( data.show === undefined ) {
			data.show = false
		}
		this.state = {
			ulShow: data.show,
		}
		this.treeUlRef = React.createRef()
		this.hasChildren = data.children && Array.isArray( data.children ) && data.children.length > 0
	}
	UNSAFE_componentWillMount(){
		this.treeUlDom = ReactDOM.findDOMNode(this.treeUlRef.current)
	}
	render(){
		let { data = {}, level, icon } = this.props ,
				iconRef = React.createRef()
		return (
			<li className={'treeLi'}>
				<div className={'rowContainer'}>
					<div className={'treeLiIconContainer columnContainer'}
						style={{
							visibility: this.hasChildren ? 'visible' : 'hidden'
						}}
						onClick={(e)=>{
							if ( !this.hasChildren ) {
								return
							}
							let treeUlDom = ReactDOM.findDOMNode(this.treeUlRef.current),
									height = getSize( treeUlDom ).height,
									ulShow = data.show
							Animation({
								operation: treeUlDom.style,
								from: {
									height: ulShow ? height : 0,
									opacity: ulShow ? 1 : 0 ,
								},
								duration: 300,
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
									treeUlDom.style.height = 'auto'
									if ( ulShow ) {	//已经完全隐藏
										treeUlDom.style.display = 'none'
									}else{	//ul已经完全展开
									}
								}
							})
							if ( ulShow ) {
								iconRef.current.style.transform = `rotate(0deg)`
							}else{
								iconRef.current.style.transform = `rotate(90deg)`
							}
						}}>
							<div className={'treeLiIcon rowContainer'} ref={iconRef} style={{
								transform: this.state.ulShow ? `rotate(90deg)` : `rotate(0deg)`
							}}>{icon}</div>
						</div>
					<div className={'treeLiTitle'}>{data.title}</div>
				</div>
				{
					this.hasChildren ?
					<TreeUl ref={this.treeUlRef} data={data.children} level={level + 1} icon={icon} show={data.show}/> : null
				}
			</li>
		)
	}
}
class TreeUl extends React.Component{
	render(){
		let { level, show, data=[], icon } = this.props
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
							<TreeLi key={index} data={item} level={level} icon={icon}/>
						)
					})
				}
			</ul>
		)
	}
}
function Tree({
	data = [],
	icon = <Triangle direction={'right'} width={3} height={6} />,
}){
	// console.log( data )
	return (
		<div className={'Tree'}>
			<TreeUl
				show={true}
				data={data}
				level={0}
				icon={icon}/>
		</div>
	)
}

export default Tree