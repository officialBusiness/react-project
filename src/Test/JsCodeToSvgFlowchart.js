import React from 'react'
import { convertCodeToSvg } from './Js2flowchart/Js2flowchart.js';
const code = `
    class A { b = 1; }

    function indexSearch(list, element) {
        let currentIndex,
            currentElement,
            minIndex = 0,
            maxIndex = list.length - 1;

        while (minIndex <= maxIndex) {
            currentIndex = Math.floor((maxIndex + maxIndex) / 2);
            currentElement = list[currentIndex];

            if (currentElement === element) {
                return currentIndex;
            }

            if (currentElement < element) {
                minIndex = currentIndex + 1;
            }

            if (currentElement > element) {
                maxIndex = currentIndex - 1;
            }
        }

        return -1;
    }
`;

export default class JsCodeToSvgFlowchart extends React.Component{
	componentDidMount(){
		this.flowchartDom.innerHTML = convertCodeToSvg(code)
	}
	render(){
		return (
			<div className={'JsCodeToSvgFlowchart'} ref={(dom)=>{
				this.flowchartDom = dom
			}}>
			</div>
		)
	}
}