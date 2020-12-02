import React from 'react';
// import styled from 'styled-components'

function Triangle({
	direction = 'top' ,
	width='10px', 
	height='10px', 
	color = 'red'
}){
	let style = {
		width: 0,
		height: 0,
	},
	heightBorder = height + ' solid ' + color,
	widthBorder = width + ' solid transparent',
	noBorder = '0 solid transparent'
	if (direction === 'top') {
		style.borderLeft = widthBorder
		style.borderRight = widthBorder
		style.borderTop = noBorder
		style.borderBottom = heightBorder
	}else if(direction === 'right'){
		style.borderLeft = heightBorder
		style.borderRight = noBorder
		style.borderTop = widthBorder
		style.borderBottom = widthBorder
	}else if(direction === 'bottom'){
		style.borderLeft = widthBorder
		style.borderRight = widthBorder
		style.borderTop = heightBorder
		style.borderBottom = noBorder
	}else if(direction === 'left'){
		style.borderLeft = noBorder
		style.borderRight = heightBorder
		style.borderTop = widthBorder
		style.borderBottom = widthBorder
	}else{
		return null
	}

	return (
		<div style={style}>
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