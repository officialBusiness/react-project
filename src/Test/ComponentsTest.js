import React , { useState } from 'react'
import styled from 'styled-components'
import Triangle from '../Components/Triangle.js'
import Arrow from '../Components/Arrow.js'
import InputNumber from '../Components/InputNumber.js'
import Tree from '../Components/Tree.js'
import Dropdown from '../Components/Dropdown.js'
import { Debounce } from '../utils'

const Container = styled.div`
	width: 130px;
	height: 40px;
	padding: 10px 0 0 30px;
`

let t = Debounce({
	callback: (v)=>{console.log(v)}, 
	wait: 1000,
	immediate: true
})
function Test() {
	const [inputValue, setInputValue] = useState(0)
	return (
		<>
			<Container>
				<Triangle
					color={'#000'}
					width={5}
					height={10}
					unit={'px'}
					direction={'bottom'}
					style={{
						cursor: 'pointer'
					}}/>
			</Container>
			<Container>
				<Arrow 
					color={'#000'}
					width={5}
					height={10}
					unit={'px'}
					thick={'1px'}
					direction={'right'}
					backgroundColor={'#fff'}
					style={{
						backgroundColor: '#fff',
						cursor: 'pointer'
					}}/>
			</Container>
			<Container >
				<InputNumber 
					value={inputValue}
					max={10}
					min={-5}
					init={0}
					unit={'px'}
					onChange={(value)=>{
						setInputValue( value )
					}} />
			</Container>
			<Container style={{
				minWidth: '100px',
				width: 'auto',
				height: 'auto',
			}}>
				<Tree data={[
					{
							title: 'node1',
							show: true,
							children: [
								{ title: 'child1' },
								{ title: 'child2' }
							]
					},
					{
							title: 'node2',
							children: [
								{
									title: 'child3',
									children: [
										{ title: 'child4' },
										{ title: 'child5' },
										{ title: 'child4' },
										{ title: 'child5' },
										{ title: 'child4' },
										{ title: 'child5' },
										{ title: 'child4' },
										{ title: 'child5' },
										{ title: 'child4' },
										{ title: 'child5' },
									]
								}
							]
					}
				]}/>
			</Container>
			<Container style={{
				fontSize: '14px',
			}}>
				<Dropdown 
					menu={['list1','list2','list3','list4','list5']}
					onClick={(e, index)=>{
						console.log('点击了菜单', index, e.target)
					}}/>
			</Container>
			<Container >
				<input onChange={(e)=>{
								// console.log('change')
								t( e.target.value )
							}}/>
			</Container>
		</>
	);
}

export default Test