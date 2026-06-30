import React from "react";
import Labelwrap from "../Labelwrap";

// Field styling shared with text inputs in the redesigned admin.
const SELECT_FIELD = "specifico-field-control !h-[38px] !min-h-[38px] box-border !bg-white !border !border-[#E7E7EF] focus:!border-[#6B66F7] focus:!outline-none focus:!shadow-[0_0_0_3px_rgba(107,102,247,0.16)] focus:!ring-0 !rounded-[10px] !py-0 !pl-[13px] !pr-9 !leading-[38px] !max-w-full appearance-none !bg-caret !bg-[length:10px_6px] !bg-[right_13px_top_50%] font-medium !text-[14px] !text-[#23232E] cursor-pointer";

const Select = ({id, placeholder, hasLabel = true, bare = false, tooltext, toolplace, className, items = [], ...rest}) => {
    const select = (
        <select id={id} name={id} {...rest} className={ ( bare ? "w-full " : ( hasLabel ? "w-[80%] " : "w-full " ) ) + SELECT_FIELD + ' ' + ( className || '' ) }>
            {items.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
            ))}
        </select>
    );

    if ( bare ) {
        return select;
    }

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
                {select}
            </div>
        </div>
    );
}

export default Select;
