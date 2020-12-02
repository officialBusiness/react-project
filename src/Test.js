import React from 'react';
import styled from 'styled-components';
import Triangle from './components/Triangle.js'
import Arrow from './components/Arrow.js'
import InputNumber from './components/InputNumber.js'
import Dropdown from './components/Dropdown.js'


const Container = styled.div`
	max-width: 100px;
	max-height: 30px;
	margin: 30px 0 0 30px;
`

function Test() {
	return (
		<>
			<div>
				<Triangle 
					color={'red'}
					width={'10px'}
					height={'10px'}
					direction={'left'}/>
			</div>
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