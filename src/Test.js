import React , { useState } from 'react';
// import React from 'react';
import styled from 'styled-components';
// import Triangle from './components/Triangle.js'
// import Arrow from './components/Arrow.js'
import InputNumber from './components/InputNumber.js'
import Tree from './components/Tree.js'
import Dropdown from './components/Dropdown.js'

const Container = styled.div`
	width: 100px;
	height: 30px;
	margin: 10px 0 0 30px;
`

function Test() {
	const [inputValue, setInputValue] = useState(0)
	return (
		<>
			{/* <Container>
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
			</Container> */}
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
				height: 'auto'
			}}>
				<Tree data={[
					{
							name: 'node1', id: 1,
							children: [
								{ name: 'child1', id: 2 },
								{ name: 'child2', id: 3 }
							]
					},
					{
							name: 'node2', id: 4,
							children: [
								{
									name: 'child3', id: 5,
									children: [
										{ name: 'child4', id: 6 },
										{ name: 'child5', id: 7 }
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
		</>
	);
}

export default Test