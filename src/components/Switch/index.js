import React from "react";
import Labelwrap from "../Labelwrap";

const Switch = ({ id, placeholder, tooltext, toolplace, ...rest }) => {
    return(
        <div className="flex items-center w-full min-h-11 py-4">
            <div className="flex items-center gap-7 w-full">
                { tooltext ?
                    <Labelwrap tooltext={tooltext} toolplace={toolplace}>
                        <span className="flex gap-2.5 items-center w-[20%]">{placeholder}</span>
                    </Labelwrap> :  <span className="flex gap-2.5 items-center w-[20%]">{placeholder}</span>
                }
                <div className="w-[80%]">
                    <label className="inline-block h-6 relative w-10">
                        <input type="checkbox" id={id} name={id} {...rest} className="h-0 w-0 opacity-0 peer"/>
                        <span className="slider round bg-[#ccc] absolute inset-x-0 inset-y-0 z-10 transition-all delay-400 peer-checked:bg-[#6B66F7] peer-checked:before:translate-x-4 rounded-full before:content-[''] before:absolute before:rounded-full before:bg-white before:left-[3px] before:bottom-[3px] before:w-[18px] before:h-[18px] before:transition-all before:delay-400"></span>
                    </label>
                </div>
            </div>
        </div>
    );
}
export default Switch;