import React , { useState }  from 'react'
import './Dropdown.scss'

function List({
	children,
	onClick=(e)=>{}
}){
	const [listHover, setListHover] = useState(false)
	return(
		<div className={'list' + (listHover ? ' hover' : '')}
			onClick={onClick}
			onMouseEnter={(e)=>{setListHover(true)}}
			onMouseLeave={(e)=>{setListHover(false)}}>
			{children}
		</div>
	)
}
function Dropdown({
	menu = [],
	onClick = ()=>{},
}){
	const [show, setShow] = useState(false)

	return (
		<div className={'Dropdown' + (show ? ' show' : '')}
			onMouseEnter={(e)=>{setShow(true)}}
			onMouseLeave={(e)=>{setShow(false)}}>
			<div className={'columnContainer'}
				onClick={(e)=>{setShow(true)}}>
				<div className={'rowContainer'}>
					<div className={'title'}>下拉菜单</div>
				</div>
			</div>
			<div className={'menuContainer'}>
				<div className={'menu'}>
					{
						menu.map((item, index)=>{
							return(
								<List key={index}
									onClick={(e)=>{
										setShow(false)
										onClick(e, index)
									}}>
									{item}
								</List>
							)
						})
					}
				</div>
			</div>
		</div>
	)
}

export default Dropdown