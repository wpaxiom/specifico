import React from "react";
import Labelwrap from "../Labelwrap";

const Select = ({id, placeholder, hasLabel = true, tooltext, toolplace, className, items = [], ...rest}) => {
    return (
        <div className="flex items-center w-full min-h-11 py-4">
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
                <select id={id} name={id} {...rest} className={ hasLabel ? "w-80% !bg-[#fbfcfd] !border !border-[#F0F0FE] !rounded !py-2 !px-5 !leading-none !max-w-full box-border appearance-none !bg-caret !bg-[length:8px_4px] !bg-[right_12px_top_50%] !text-[#555555]" + ' ' + className : "w-full !bg-[#fbfcfd] !border !border-[#F0F0FE] !rounded !py-2 !px-5 !leading-none !max-w-full box-border appearance-none !bg-caret !bg-[length:8px_4px] !bg-[right_12px_top_50%] !text-[#555555]" + ' ' + className} >
                    {items.map((item) => (
                        <option value={item.value}>{item.label}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}

export default Select;