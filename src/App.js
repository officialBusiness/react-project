import React from 'react'
import { Link } from "react-router-dom";
import './App.scss'
import { browser } from './utils'

export default class App extends React.Component{
	render(){
		return (
			<div id={'index'}>
				<div className={'index-title'}>
					react相关积累博客
				</div>
				<div className={'index-contents'}>
					<a href={'#Test'} className={'index-content cardStyle'}>
						<div className={'index-content-title'}>
							小组件
						</div>
						<div className={'index-content-description'}>
							{/* <span>树</span>
							<span>下拉菜单</span>
							<span>数字输入框</span> */}
							数字输入框、下拉菜单
						</div>
					</a>
					<a href={'#Test'} className={'index-content cardStyle'}>
						<div className={'index-content-title'}>
							源码解读
						</div>
						<div className={'index-content-description'}>
							{/* <span>tween</span>
							<span>jQuery</span> */}
							tween、jQuery
						</div>
					</a>
					<a href={'#Test'} className={'index-content cardStyle'}>
						<div className={'index-content-title'}>
							操作工具
						</div>
						<div className={'index-content-description'}>
							三维模型操作、数据可视化
							{/* <span>三维模型操作</span> */}
						</div>
					</a>
				</div>
				<div className={'foot row'}>
					{
						browser() === 'PC' ?
						<a className={'QQ'} target={"view_window"} href={"http://wpa.qq.com/msgrd?v=3&uin=2943622466&site=qq&menu=yes"}>
							QQ：2943622466
						</a> : 
						<a className={'QQ'} href={"mqqwpa://im/chat?chat_type=wpa&uin=2943622466&version=1&src_type=web"}>
							QQ：2943622466
						</a>
					}
				</div>
			</div>
		)
	}
}