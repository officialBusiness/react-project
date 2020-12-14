import React from 'react'
import ReactDOM from 'react-dom'
import Triangle from './Triangle.js'
import './Tree.scss'
import { getNoneSize } from '../utils.js'

class TreeLi extends React.Component{
  constructor(props) {
    super(props);
		if ( this.props.data.show === void 0 ) {
			this.props.data.show = false
		}
    this.state = {
    	show: this.props.data.show,
    }
		console.log( this.state.show )
  }
	render(){
		let { data = {}, level, icon } = this.props ,
				hasChildren = data.children && Array.isArray( data.children ) && data.children.length > 0 ,
				iconRef = React.createRef() ,
				treeUlRef = React.createRef()
		return (
			<li className={'treeLi'}>
				<div className={'rowContainer'}>
					<div className={'treeLiIconContainer columnContainer'}
						style={{
							visibility: hasChildren ? 'visible' : 'hidden'
						}} 
						onClick={(e)=>{
							let treeUlDom = ReactDOM.findDOMNode(treeUlRef.current)
							console.log( getNoneSize(treeUlDom) )
							this.setState({
								show: !this.state.show
							})
							if ( this.state.show ) {
								iconRef.current.style.transform = `rotate(0deg)`
							}else{
								iconRef.current.style.transform = `rotate(90deg)`
							}
						}}>
							<div className={'treeLiIcon rowContainer'} ref={iconRef} style={{
								transform: this.state.show ? `rotate(90deg)` : `rotate(0deg)`
							}}>{icon}</div>
						</div>
					<div className={'treeLiTitle'}>{data.title}</div>
				</div>
				{
					hasChildren ?
					<TreeUl ref={treeUlRef} data={data.children} level={level + 1} icon={icon} show={this.state.show}/> : null
				}
			</li>
		)
	}
}
class TreeUl extends React.Component{
	render(){
		let { level, show = false , data=[], icon } = this.props
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