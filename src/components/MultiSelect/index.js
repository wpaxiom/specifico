import React from "react";
import Select, {
    components,
} from "react-select";
import makeAnimated from 'react-select/animated';
import Labelwrap from "../Labelwrap";
import Caret from "../Icons/Caret";

const animatedComponents = makeAnimated();
const MultiSelect = ( {id, placeholder, hasLabel = true, tooltext, toolplace, ...rest} ) => {

    const DropdownIndicator = props => {
        return (
            <components.DropdownIndicator {...props} className="!p-0 !pr-5">
                <Caret/>
            </components.DropdownIndicator>
        )
    }

    const customClasses = {
        container: () => hasLabel ? "w-[80%]" : "w-full",
        control: () => "w-full !bg-[#fbfcfd] !border !border-[#F0F0FE] !rounded !py-0 !px-0 !leading-none !text-[#555555] !min-h-[30px]",
        // placeholder: () => placeholderStyles,
         input: () => "!m-0 !p-0",
         valueContainer: () => "!py-0 !px-1.5",
        // singleValue: () => singleValueStyles,
        // multiValue: () => multiValueStyles,
        multiValueLabel: () => '!py-0.5 !pr-0 !pl-1 !bg-[#F5F5FE]',
        multiValueRemove: () => '!px-0.5 !bg-[#F5F5FE]',
        // clearIndicator: () => clearIndicatorStyles,
        indicatorSeparator: () => "!hidden",
        // dropdownIndicator: () => dropdownIndicatorStyles,
        // menu: () => menuStyles,
        // groupHeading: () => groupHeadingStyles,
        // option: ({ isFocused, isSelected }) =>
        //     clsx(
        //         isFocused && optionStyles.focus,
        //         isSelected && optionStyles.selected,
        //         optionStyles.base,
        //     ),
        // noOptionsMessage: () => noOptionsMessageStyles,
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
                <Select
                    id={id}
                    classNames={customClasses}
                    closeMenuOnSelect={true}
                    components={{animatedComponents, DropdownIndicator}}
                    {...rest}/>
            </div>
        </div>
    )
}

export default MultiSelect;