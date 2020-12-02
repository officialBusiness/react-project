import React from 'react';

function Triangle({
	direction = 'top' ,
	width=10, 
	height=10,
	unit='px',
	color = '#000',
	style = ''
}){
	let triangleStyle = {
		width: 0,
		height: 0,
	},
	heightBorder = height + unit + ' solid ' + color,
	widthBorder = width + unit + ' solid transparent',
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
