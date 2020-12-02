import React from 'react';
import Triangle from './Triangle.js'

function Arrow({
	direction='top' ,
	width='10px', 
	height='10px',
	unit='px',
	color='red',
	thick='1px', 
	backgroundColor='#fff',
	style=''
}){
	let 
			style1= {
				position: 'absolute',
				[direction]: 0,
			},
			style2 = {
				position: 'absolute',
				[direction]: thick,
			}
	return(
		<div className={"arrow"}
			style={{
				position: 'relative',
				width: width*2 + unit,
				height: height + unit,
				...style
			}}>
			<Triangle 
				direction={direction}
				color={color}
				width={width}
				height={height}
				style={ style1 }/>
			<Triangle
				direction={direction}
				color={backgroundColor}
				width={width}
				height={height}
				style={ style2 }/>
		</div>
	)
}


export default Arrow