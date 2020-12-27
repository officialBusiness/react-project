import React from 'react'
import './RichTextBoxTest.scss'

export default class RichTextBoxTest extends React.Component{
	render(){
		return (
			<div className={'SourceCode'} >
				<div className={'RichTextBox'}>
					<textarea
						placeholder={'请输入标题'}
						className={'title'}
						maxLength={'128'}
						onKeyDown={(e)=>{
							console.log( e )
						}}>

					</textarea>
					<div className={'content'} contentEditable={'true'}>

					</div>
				</div>
			</div>
		)
	}
}