import React, { useCallback, useRef, useState } from "react";
import { HexAlphaColorPicker } from "react-colorful";
import useClickOutside from "../../hooks/useClickOutside";
import Labelwrap from "../Labelwrap";

export const PopOverPicker = ({ id, color, onChange, placeholder, tooltext, toolplace, ...rest }) => {
    const popover = useRef();
    const [isOpen, toggle] = useState(false);

    const close = useCallback(() => toggle(false), []);
    useClickOutside(popover, close);


    return (
        <div className="specifico-form-control">
            <div className="specifico-content__color specifico-field__wrap">
                { tooltext ?
                    <Labelwrap tooltext={tooltext} toolplace={toolplace}>
                        <label htmlFor={id}>{placeholder}</label>
                    </Labelwrap> :  <label htmlFor={id} className="specifico-field__label">{placeholder}</label>
                }
                <div className="specifico-content__color-swatch-wrap specifico-field__content">
                    <div className="specifico-content__color-inner">
                        <input id={id} name={id} value={color} onChange={ (e) => { onChange( e.target.value ) }} {...rest}/>
                        <div className="specifico-content__color-swatch" onClick={() => toggle(true)} />
                        {isOpen && (
                            <div className="specifico-content__color-popover" ref={popover}>
                                <HexAlphaColorPicker color={color} onChange={onChange} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
