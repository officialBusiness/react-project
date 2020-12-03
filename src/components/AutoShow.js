import React from 'react';
import './AutoShow.scss'

function AutoShow(){
	return (
		<div className={'AutoShow'}>
			<div className={'titleContainer'}>
				<div className={'title'}>自动展开</div>
				<div className={'icon'}>
					<div className={'lineH'}></div>
					<div className={'lineV'}></div>
				</div>
			</div>
			<div className={'show'}>
				展示内容
			</div>
		</div>
	)
}

export default AutoShow