import React from 'react'
import './InputNumber.scss'

class InputNumber extends React.Component{
	constructor(props) {
		super(props)
		this.max = props.max || Infinity			//数字上限
		this.min = props.min || -Infinity		//数字下限
		this.step = props.step || 1
		this.init = props.init || 0
		this.onChange = props.onChange
		this.unit = props.unit

		if ( this.max < this.min ) {
			throw Error('InputNumber组件参数出错：最大值max不能比最小值min小')
		}
		if ( !isFinite(this.props.value) && this.props.value !== '-') {
			throw Error('InputNumber组件参数出错：value必须是数字')
		}
		this.modifiedRef = React.createRef()
		this.modifiedShow = false	
	}
	setModifiedShow(show){
		if ( this.modifiedShow === show ) {
			return
		}
		this.modifiedShow = show
		if ( show ) {
			this.modifiedRef.current.className = 'modified modifiedShow'
		}else{
			this.modifiedRef.current.className = 'modified'
		}
	}
	// 对输入的数字进行检查
	check(number){
		if ( number > this.max ) {
			return this.max
		}
		if ( number < this.min ) {
			return this.min
		}
		if ( isFinite(number) || number === '-') {
			return number
		}else{
			return this.init
		}
	}
	render(){
		let { value } = this.props || 0
		return (
			<div className={'InputNumber borderStyle rowContainer'}
				onMouseEnter={(e)=>{this.setModifiedShow(true)}}
				onMouseLeave={(e)=>{this.setModifiedShow(false)}}>
				<div className='input columnContainer'>
					<input type={'text'} value={ value } 
						onChange={(e)=>{
							let value = e.target.value
							if ( value === '' ) {
								value = this.init
							}
							if ( value === '-' ) {
								this.onChange('-')
								return
							}
							let number = parseInt( value )
							if ( this.onChange) {
								this.onChange(this.check(number))
							}
						}}
						onFocus={(e)=>{this.setModifiedShow(true)}}/>
				</div>
				<div className={'modified'} ref={this.modifiedRef}>
					<div className={'unit columnContainer'}>
						<div>{this.unit}</div>
					</div>
					<div className={'operation columnContainer'}>
						<div className={'add columnContainer'}
							onClick={(e)=>{
								if ( this.onChange ) {
									this.onChange(this.check(value + this.step))
								}
							}}>
							<div className={'top-arrow row'}>
								<div className="top-arrow1"></div>
								<div className="top-arrow2"></div>
							</div>
						</div>
						<div className={'reducing columnContainer'}
							onClick={(e)=>{
								if( !this.modifiedShow ){
									this.setModifiedShow(true)
								}
								if ( this.onChange ) {
									this.onChange(this.check(value - this.step))
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
}

export default InputNumber