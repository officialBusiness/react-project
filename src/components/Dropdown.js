import React from 'react';
import './Dropdown.scss'

function Dropdown(){
	return (
		<div className={'Dropdown'}>
			<div className={'colomContainer'}>
				<div className={'rowContainer'}>
					<div className={'title'}>下拉菜单</div>
					<div className={'icon'}>
						<div className={'lineH'}></div>
						<div className={'lineV'}></div>
					</div>
				</div>
			</div>
			<div className={'show'}>
				<div>
					<div className={'list'}>
						list1
					</div>
					<div className={'list'}>
						list2
					</div>
					<div className={'list'}>
						list3
					</div>
					<div className={'list'}>
						list4
					</div>
					<div className={'list'}>
						list5
					</div>
				</div>
			</div>
		</div>
	)
}

export default Dropdown