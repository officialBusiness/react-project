// import React , { useState } from 'react';
import React from 'react';
import './Dropdown.scss'

export default ({menu})=>{
	// const [menuClass, setMenuClass] = useState(' hidden')
	return (
		<div className={'dropdown'} 
			onMouseEnter={(e)=>{
				// setMenuClass('')
			}}
			onMouseLeave={(e)=>{
				// setMenuClass('')
			}}>
			<div className={'dropdown-back'}>
				<span>下拉菜单</span>
			</div>
			<div className={'dropdown-menu-container'}>
				<div className={'dropdown-menu'} >
					{
						menu.map((item, index)=>{
							return (
								<div className={'dropdown-menu-item'} key={index} onClick={(e)=>{
									console.log('点击了选项', index)
								}}>{item}</div>
							)
						})
					}
				</div>
			</div>
		</div>
	)
}