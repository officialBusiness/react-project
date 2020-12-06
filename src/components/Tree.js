import React from 'react';
import './Tree.scss'

function Tree(){
	return (
		<div className={'Tree'}>
			<div className={'root child'}>
				<div className={'node'}>树组件</div>
				<div className={'child'}>
					<div className={'node'}>子节点</div>
					<div className={'node'}>子节点</div>
					<div className={'node'}>子节点</div>
				</div>
			</div>
		</div>
	)
}

export default Tree