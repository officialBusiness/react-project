import React, { useState } from 'react';
import './InputNumber.scss'

export default ({onChange, step = 1, max, min, value = 0})=>{
	const [inputValue, setInputValue] = useState(value)

	return (
		<div className={'InputNumber'} 
			onMouseEnter={(e)=>{
				// console.log("e:", e)
			}}
			onMouseLeave={(e)=>{
				// console.log("e:", e)
			}}>
			<input type={'text'} value={ inputValue } onChange={(e)=>{
				console.log('e.target.value', e.target.value)
				if ( e.target.value === '' || e.target.value === '-') {
					setInputValue( 0 )
					return
				}
				let number = parseInt(e.target.value)
				if ( isFinite(number) ) {
					setInputValue( number )
				}
			}}/>
			<div className={'modified'}>
				<div className={'unit'}>
					px
				</div>
				<div className={'operation'}>
					<div className={'add'} onClick={(e)=>{
						console.log('数字添加')
						setInputValue( inputValue + step )
					}}>
						<div className={'top-arrow'}>
							<div className="top-arrow1"></div>
							<div className="top-arrow2"></div>
						</div>
					</div>
					<div className={'reducing'} onClick={(e)=>{
						console.log('数字减少')
						setInputValue( inputValue - step )
						}}>
						<div className={'bottom-arrow'}>
							<div className="bottom-arrow1"></div>
							<div className="bottom-arrow2"></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}