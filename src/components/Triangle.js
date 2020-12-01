import React from 'react';
// import styled from 'styled-components'

function Triangle({direction ,width, height}){
	return (
		<div style={{
			width: 0,
			height: 0,
			borderLeft: '0 solid transparent',
			borderRight: '10px solid red',
			borderTop: '10px solid transparent',
			borderBottom: '10px solid transparent',
		}}>
		</div>
	)
}

export default Triangle


// export default styled.div`
// 	width: 0;
// 	height: 0;
// 	border-top: 25px solid blue;
// 	border-left: 25px solid red;
// 	border-right: 25px solid purple;
// 	border-bottom: 25px solid yellow;
// `