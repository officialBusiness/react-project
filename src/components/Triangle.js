import React from 'react';

function Triangle({
	direction = 'top' ,
	width='10px', 
	height='10px', 
	color = 'red',
	style = ''
}){
	let triangleStyle = {
		width: 0,
		height: 0,
	},
	heightBorder = height + ' solid ' + color,
	widthBorder = width + ' solid transparent',
	noBorder = '0 solid transparent'
	if (direction === 'top') {
		triangleStyle.borderLeft = widthBorder
		triangleStyle.borderRight = widthBorder
		triangleStyle.borderTop = noBorder
		triangleStyle.borderBottom = heightBorder
	}else if(direction === 'right'){
		triangleStyle.borderLeft = heightBorder
		triangleStyle.borderRight = noBorder
		triangleStyle.borderTop = widthBorder
		triangleStyle.borderBottom = widthBorder
	}else if(direction === 'bottom'){
		triangleStyle.borderLeft = widthBorder
		triangleStyle.borderRight = widthBorder
		triangleStyle.borderTop = heightBorder
		triangleStyle.borderBottom = noBorder
	}else if(direction === 'left'){
		triangleStyle.borderLeft = noBorder
		triangleStyle.borderRight = heightBorder
		triangleStyle.borderTop = widthBorder
		triangleStyle.borderBottom = widthBorder
	}else{
		return null
	}
	if ( style ) {
		for(let key in style){
			triangleStyle[key] = style[key]
		}
	}
	return (
		<div style={triangleStyle}>
		</div>
	)
}

export default Triangle
