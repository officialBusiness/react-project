import React from 'react';
import './Dropdown.scss'

function Dropdown({
	menu = []
}){
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
				<div className={'menu'}>
					{
						menu.map((item, index)=>{
							return(
								<div className={'list'} key={index}>
									{item}
								</div>
							)
						})
					}
				</div>
			</div>
		</div>
	)
}

export default Dropdown