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
        control: ({ isFocused }) =>
            "w-full !bg-[#fbfcfd] !rounded !py-0 !px-0 !leading-none !text-[#555555] !min-h-[36px] !shadow-none !border " +
            (isFocused ? "!border-[#C9C7FB]" : "!border-[#F0F0FE]"),
        input: () => "!m-0 !p-0 [&_input]:!shadow-none [&_input:focus]:!shadow-none [&_input]:!ring-0",
        valueContainer: () => "!py-1 !px-2 !gap-1",
        placeholder: () => "!text-[#999999] !text-sm !m-0",
        singleValue: () => "!text-[#555555]",
        multiValue: () => "!bg-[#F5F5FE] !rounded !m-0 !overflow-hidden",
        multiValueLabel: () => "!py-1.5 !pr-1 !pl-3 !text-[#555555] !text-sm",
        multiValueRemove: () => "!pl-1 !pr-2 !text-[#999999] hover:!bg-[#E9E8FE] hover:!text-[#555555]",
        indicatorSeparator: () => "!hidden",
        indicatorsContainer: () => "!py-0",
        clearIndicator: () => "!p-1 !text-[#555555] hover:!text-[#333333] cursor-pointer",
        dropdownIndicator: () => "!p-1 !text-[#555555]",
        menu: () => "!rounded !border !border-[#E9E8FE] !shadow-lg !mt-1 !overflow-hidden",
        menuList: () => "!py-1",
        option: ({ isFocused, isSelected }) =>
            "!px-3 !py-2 !text-sm !cursor-pointer " +
            (isSelected
                ? "!bg-[#6B66F7] !text-white"
                : isFocused
                    ? "!bg-[#F5F5FE] !text-[#555555]"
                    : "!bg-white !text-[#555555]"),
        noOptionsMessage: () => "!text-[#999999] !text-sm !py-2",
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
                    isClearable={false}
                    components={{animatedComponents, DropdownIndicator}}
                    {...rest}/>
            </div>
        </div>
    )
}

export default MultiSelect;