import React from 'react'
import Triangle from './Triangle.js'

function Arrow({
	direction='top' ,
	width=10, 
	height=10,
	thick=1, 
	unit='px',
	color='#000',
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
				[direction]: thick + unit,
			}
	return(
		<div className={"arrow"}
			style={{
				position: 'relative',
				width: width*2 + unit,
				height: height + thick + unit,
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