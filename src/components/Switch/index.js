import React from "react";
import Labelwrap from "../Labelwrap";

// The toggle control itself (44×25 pill, 19px knob) — design tokens.
const Toggle = ({ id, ...rest }) => (
    <label className="inline-block h-[25px] relative w-11 align-middle cursor-pointer">
        <input type="checkbox" id={id} name={id} {...rest} className="h-0 w-0 opacity-0 peer" />
        <span className="absolute inset-0 z-10 rounded-full bg-[#D5D5E0] transition-colors peer-checked:bg-[#6B66F7] before:content-[''] before:absolute before:rounded-full before:bg-white before:shadow-[0_1px_3px_rgba(0,0,0,0.25)] before:left-[3px] before:top-[3px] before:w-[19px] before:h-[19px] before:transition-all peer-checked:before:translate-x-[19px]" />
    </label>
);

const Switch = ({ id, placeholder, tooltext, toolplace, bare = false, ...rest }) => {
    // Bare mode returns just the toggle, for callers that lay out their own
    // label/description (e.g. the new settings & panel grids).
    if ( bare ) {
        return <Toggle id={id} {...rest} />;
    }

    return(
        <div className="flex items-center w-full min-h-11 py-4">
            <div className="flex items-center gap-7 w-full">
                { tooltext ?
                    <Labelwrap tooltext={tooltext} toolplace={toolplace}>
                        <span className="flex gap-2.5 items-center w-[20%]">{placeholder}</span>
                    </Labelwrap> :  <span className="flex gap-2.5 items-center w-[20%]">{placeholder}</span>
                }
                <div className="w-[80%]">
                    <Toggle id={id} {...rest} />
                </div>
            </div>
        </div>
    );
}
export default Switch;
