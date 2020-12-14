import React from 'react';
import './Tree.scss'
import { getNoneSize } from '../utils.js'

function Tree({
	data = []
}){
	// var a = React.createRef()
	console.log('data:', data)

	return (
		<div className={'Tree'}>
			<div className={'root child'}>
				<div className={'node'} onClick={(e)=>{
					// var dom = a.current
					// console.log( dom )
					// console.log( getNoneSize(dom) )
				}}>树组件</div>
			</div>
		</div>
	)
}

export default Tree