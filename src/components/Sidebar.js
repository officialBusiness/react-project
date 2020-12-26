import React from 'react'
// import ReactDOM from 'react-dom'
import './Sidebar.scss'


class Sidebar extends React.Component{
	render(){
		return (
			<>
				<div className={'Sidebar'}>
					测试
				</div>
				<div onClick={(e)=>{
					console.log('显示')
				}}>
					显示Sidebar
				</div>
			</>
		)
	}
}

var SidebarControl = {

}
export {SidebarControl , Sidebar}