import React from 'react';
import './InputNumber.scss'

function InputNumber({
	max = Infinity,
	min = -Infinity,
	step = 1,
	value = 0,
	init = 0,
	onChange,
	unit='',
}){
	if ( max < min ) {
		throw Error('InputNumber组件参数出错：最大值max不能比最小值min小')
	}
	if ( !isFinite(value) && value !== '-') {
		throw Error('InputNumber组件参数出错：value必须是数字')
	}
	function check(number){
		if ( number > max ) {
			return max
		}
		if ( number < min ) {
			return min
		}
		if ( isFinite(number) || number === '-') {
			return number
		}else{
			return init
		}
	}
	return (
		<div className={'InputNumber'} >
			<div className='input'>
				<input type={'text'} value={ value } onChange={(e)=>{
					let value = e.target.value
					if ( value === '' ) {
						value = init
					}
					if ( value === '-' ) {
						onChange('-')
						return
					}
					let number = parseInt( value )
					if ( onChange) {
						onChange(check(number))
					}
				}}/>
			</div>
			<div className={'modified'}>
				<div className={'unit'}>
					<span>{unit}</span>
				</div>
				<div className={'operation'}>
					<div className={'add'} onClick={(e)=>{
						if ( onChange ) {
							onChange(check(value + step))
						}
					}}>
						<div className={'top-arrow'}>
							<div className="top-arrow1"></div>
							<div className="top-arrow2"></div>
						</div>
					</div>
					<div className={'reducing'} onClick={(e)=>{
						if ( onChange ) {
							onChange(check(value - step))
						}
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

export default InputNumber