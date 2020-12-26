import React , { useState } from 'react'
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
	const [modifiedShow, setModifiedShow] = useState(false) 
	if ( max < min ) {
		throw Error('InputNumber组件参数出错：最大值max不能比最小值min小')
	}
	if ( !isFinite(value) && value !== '-') {
		throw Error('InputNumber组件参数出错：value必须是数字')
	}
	// 对输入的数字进行检查
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
		<div className={'InputNumber borderStyle rowContainer'}
			onMouseEnter={(e)=>{setModifiedShow(true)}}
			onMouseLeave={(e)=>{setModifiedShow(false)}}>
			<div className='input columnContainer'>
				<input type={'text'} value={ value } 
					onChange={(e)=>{
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
					}}
					onFocus={(e)=>{setModifiedShow(true)}}/>
			</div>
			<div className={'modified' + ( modifiedShow ? ' modifiedShow' : '' )}>
				<div className={'unit columnContainer'}>
					<div>{unit}</div>
				</div>
				<div className={'operation columnContainer'}>
					<div className={'add columnContainer'}
						onClick={(e)=>{
							if ( onChange ) {
								onChange(check(value + step))
							}
						}}>
						<div className={'top-arrow row'}>
							<div className="top-arrow1"></div>
							<div className="top-arrow2"></div>
						</div>
					</div>
					<div className={'reducing columnContainer'}
						onClick={(e)=>{
							if( !modifiedShow ){
								setModifiedShow(true)
							}
							if ( onChange ) {
								onChange(check(value - step))
							}
						}}>
						<div className={'bottom-arrow row'}>
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