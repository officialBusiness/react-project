// import React , { useState } from 'react';
import React from 'react';
import styled from 'styled-components';
// import Triangle from './components/Triangle.js'
// import Arrow from './components/Arrow.js'
// import InputNumber from './components/InputNumber.js'
// import Tree from './components/Tree.js'
import AutoShow from './components/AutoShow.js'

const Container = styled.div`
	min-width: 100px;
	min-height: 30px;
	margin: 10px 0 0 30px;
`

function Test() {
	// const [inputValue, setInputValue] = useState(0)
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
			</Container>
			<Container style={{
				width: '100px',
				height: '30px', }}>
				<InputNumber 
					value={inputValue}
					max={10}
					min={-5}
					init={0}
					unit={'px'}
					onChange={(value)=>{
						setInputValue( value )
					}} />
			</Container> */}
			{/* <Container >
				<Tree />
			</Container> */}
			<Container >
				<AutoShow />
			</Container>
		</>
	);
}

export default Test