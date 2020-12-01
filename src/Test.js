import React from 'react';
import styled from 'styled-components';
import Triangle from './components/Triangle.js'
import Arrow from './components/Arrow.js'
import InputNumber from './components/InputNumber.js'
import Dropdown from './components/Dropdown.js'


const Container = styled.div`
	width: 100px;
	height: 30px;
	margin: 30px 0 0 30px;
`

function Test() {
	return (
		<>
			<Container>
				<Triangle />
			</Container>
			<Container>
				<Arrow />
			</Container>
			<Container>
				<Dropdown menu={[1,2,3,4]}/>
			</Container>
			<Container>
				<InputNumber />
			</Container>
		</>
	);
}

export default Test