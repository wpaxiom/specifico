import React, { useState } from 'react';
import Add from "../Icons/Add";
import Trash from "../Icons/Trash";
import MultiSelect from "../MultiSelect";
const MappingRepeater = ({ metaFields, onAddField, onChange, onRemoveField, onChangeType, spec, type, values, loading, disabled }) => {
    return (
        <>
            {metaFields.map((field, index) => (
                <div key={index} className="flex gap-2.5 relative before:content-'' before:w-full before:h-px before:bg-dash-border before:bg-repeat-x before:absolute before:bottom-0">
                    <MultiSelect value={field.category} hasLabel={false} onChange={e => onChange(index, 'category', e)} options={spec}/>
                    <MultiSelect value={field.type} hasLabel={false} onChange={e => onChangeType(index, 'type', e)} options={type}/>
                    <MultiSelect isMulti value={field.values} hasLabel={false} onChange={e => onChange(index, 'values', e)} options={values} isDisabled={disabled}/>
                    <button onClick={() => onRemoveField(index)} className="p-1 w-8 h-8 bg-[#FBFCFD] border border-[#E9E8FE] rounded my-4">
                        <Trash />
                    </button>
                </div>
            ))}
            <button onClick={onAddField} className="flex gap-1 items-center px-3.5 py-2.5 bg-[#6B66F7] rounded text-white mt-4">
                <Add />
                Add Mapping
            </button>
        </>
    );
};

export default MappingRepeater;