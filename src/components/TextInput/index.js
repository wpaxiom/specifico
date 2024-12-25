import React from "react";
import Labelwrap from "../Labelwrap";

const TextInput = ({id, placeholder, hasLabel = true, tooltext, toolplace, className, ...rest}) => {
    return (
        <div className={ "flex items-center w-full min-h-11 py-4"  + ' ' + className}>
            <div className="flex items-center gap-7 w-full">
                { hasLabel &&
                    <>
                        { tooltext ?
                            <Labelwrap tooltext={tooltext} toolplace={toolplace}>
                                <label htmlFor={id} className="flex gap-2.5 items-center w-[20%]">{placeholder}</label>
                            </Labelwrap> :  <label htmlFor={id} className="flex gap-2.5 items-center w-[20%]">{placeholder}</label>
                        }
                    </>
                }
                <input id={id} name={id} {...rest} placeholder={placeholder} className= { hasLabel ? "w-[80%] !bg-[#fbfcfd] !border !border-[#F0F0FE] !rounded !py-2 !px-5 !leading-none !text-[#555555]" : "w-full !bg-[#fbfcfd] !border !border-[#F0F0FE] !rounded !py-2 !px-5 !leading-none !text-[#555555]" } />
            </div>
        </div>
    );
}
export default TextInput;