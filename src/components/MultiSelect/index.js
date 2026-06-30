import React from "react";
import Select, { components } from "react-select";
import Labelwrap from "../Labelwrap";

const Chevron = () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M3 4.5 6 7.5 9 4.5" stroke="#9A9AAE" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const DropdownIndicator = ( props ) => (
    <components.DropdownIndicator { ...props }><Chevron /></components.DropdownIndicator>
);

const FONT = "'Nunito', system-ui, sans-serif";

// All styling lives in the `styles` prop (emotion, high specificity) rather than
// Tailwind classes: it beats WP-admin's global input CSS that was inflating the
// control, and it keeps working when the menu is portaled to <body>.
const rsStyles = {
    control: ( base, state ) => ( {
        ...base,
        minHeight: 38,
        padding: 0,
        backgroundColor: '#fff',
        borderColor: state.isFocused ? '#6B66F7' : '#E7E7EF',
        borderRadius: 10,
        boxShadow: state.isFocused ? '0 0 0 3px rgba(107,102,247,0.16)' : 'none',
        fontFamily: FONT,
        '&:hover': { borderColor: state.isFocused ? '#6B66F7' : '#D8D8E4' },
    } ),
    // Matches the design control: padding 4px 8px, 6px gap between chips.
    valueContainer: ( base ) => ( { ...base, padding: '4px 8px', gap: 6 } ),
    placeholder: ( base ) => ( { ...base, color: '#9A9AAE', fontSize: 14, fontFamily: FONT, margin: 0 } ),
    singleValue: ( base ) => ( { ...base, color: '#23232E', fontSize: 14, fontFamily: FONT } ),
    input: ( base ) => ( { ...base, margin: 0, padding: 0, color: '#23232E', fontFamily: FONT } ),
    // Chip = padding 5px 7px 5px 11px (label holds left/top/bottom, remove the right).
    multiValue: ( base ) => ( { ...base, backgroundColor: '#EDEBFF', borderRadius: 8, overflow: 'hidden', margin: 0 } ),
    multiValueLabel: ( base ) => ( { ...base, color: '#6B66F7', fontWeight: 700, fontSize: 12.5, fontFamily: FONT, padding: '5px 4px 5px 11px' } ),
    multiValueRemove: ( base ) => ( { ...base, color: '#6B66F7', paddingLeft: 0, paddingRight: 7, ':hover': { backgroundColor: '#E2DFFF', color: '#6B66F7' } } ),
    indicatorSeparator: () => ( { display: 'none' } ),
    indicatorsContainer: ( base ) => ( { ...base, padding: 0 } ),
    dropdownIndicator: ( base ) => ( { ...base, padding: '0 13px' } ),
    clearIndicator: ( base ) => ( { ...base, padding: '0 4px', color: '#9A9AAE', ':hover': { color: '#54546A' } } ),
    menuPortal: ( base ) => ( { ...base, zIndex: 99999 } ),
    menu: ( base ) => ( {
        ...base,
        borderRadius: 12,
        border: '1px solid #EDEDF3',
        boxShadow: '0 10px 30px -8px rgba(30,28,80,0.28)',
        overflow: 'hidden',
        fontFamily: FONT,
        zIndex: 99999,
    } ),
    menuList: ( base ) => ( { ...base, padding: 6 } ),
    option: ( base, state ) => ( {
        ...base,
        fontSize: 13.5,
        fontWeight: 600,
        fontFamily: FONT,
        padding: '8px 12px',
        borderRadius: 8,
        cursor: 'pointer',
        color: state.isSelected ? '#fff' : '#54546A',
        backgroundColor: state.isSelected ? '#6B66F7' : state.isFocused ? '#F6F5FF' : '#fff',
        ':active': { backgroundColor: state.isSelected ? '#6B66F7' : '#F6F5FF' },
    } ),
    noOptionsMessage: ( base ) => ( { ...base, color: '#9A9AAE', fontSize: 14, fontFamily: FONT } ),
};

const MultiSelect = ( { id, placeholder, hasLabel = true, bare = false, tooltext, toolplace, ...rest } ) => {
    const select = (
        <Select
            inputId={ id }
            classNamePrefix="specifico-rs"
            styles={ rsStyles }
            placeholder={ placeholder }
            closeMenuOnSelect={ ! rest.isMulti }
            isClearable={ false }
            menuPlacement="auto"
            menuPortalTarget={ typeof document !== 'undefined' ? document.body : null }
            components={ { DropdownIndicator } }
            { ...rest }
        />
    );

    if ( bare ) {
        return select;
    }

    return (
        <div className="flex items-center w-full min-h-11 py-4">
            <div className="flex items-center w-full gap-7">
                { hasLabel &&
                    <>
                        { tooltext ?
                            <Labelwrap tooltext={tooltext} toolplace={toolplace}>
                                <label htmlFor={id} className="flex gap-2.5 items-center w-[20%]" >{placeholder}</label>
                            </Labelwrap> :  <label htmlFor={id} className="flex gap-2.5 items-center w-[20%]">{placeholder}</label>
                        }
                    </>
                }
                <div className={ hasLabel ? "w-[80%]" : "w-full" }>{select}</div>
            </div>
        </div>
    )
}

export default MultiSelect;
