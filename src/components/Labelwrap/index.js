import React from "react";

const Labelwrap = ({ tooltext, toolplace, children, ...rest }) => {
    return(
        <div className="cartick-field__label">
            {children}
            <div className={"cartick-tooltip " + toolplace } data-tooltip={tooltext} >
                <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.5 19.75C15.3125 19.75 19.25 15.8125 19.25 11C19.25 6.1875 15.3125 2.25 10.5 2.25C5.6875 2.25 1.75 6.1875 1.75 11C1.75 15.8125 5.6875 19.75 10.5 19.75Z" stroke="#3C434A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M10.5 7.5V11.875" stroke="#3C434A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M10.4951 14.5H10.503" stroke="#3C434A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
        </div>
    )
}
export default Labelwrap;