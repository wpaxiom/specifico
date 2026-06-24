import React, { useState } from 'react';
import TextInput from "../TextInput";
import Select from "../Select";
import Add from "../Icons/Add";
import Trash from "../Icons/Trash";
const PostMetaRepeater = ({ metaFields, onAddField, onChange, onRemoveField }) => {
    return (
        <>
            {metaFields.map((field, index) => (
                <div key={index} className="flex gap-2.5 relative before:content-[''] before:w-full before:h-px before:bg-dash-border before:bg-repeat-x before:absolute before:bottom-0">
                    <TextInput type="text" value={field.attributeName} hasLabel={false} onChange={e => onChange(index, 'attributeName', e.target.value)} placeholder="Attribute Name" className="!w-1/4"/>
                    <TextInput type="text" value={field.attributeValue} hasLabel={false} onChange={e => onChange(index, 'attributeValue', e.target.value)} placeholder="Attribute Value" className="!w-1/4"/>
                    <div className="flex items-center min-h-11 gap-2.5 !w-2/4">
                        <Select placeholder="Attribute Type" id="attribute-type" value={field.attributeType} hasLabel={false} onChange={e => onChange(index, 'attributeType', e.target.value)} items={ [{ label: "Text", value: "text" }, { label: "Select", value: "select"}, { label: "Radio", value: "radio" }, { label: "Textarea", value: "textarea" }] } className="!leading-snug" />
                        {(field.attributeType === 'select' || field.attributeType === 'radio') && (
                            <TextInput type="text" value={field.defaultValue} hasLabel={false} onChange={e => onChange(index, 'defaultValue', e.target.value)} placeholder="Default Value"/>
                        )}
                    </div>
                    <button onClick={() => onRemoveField(index)} className="p-[10px] max-h-[42px] self-center bg-[#FBFCFD] border border-[#E9E8FE] rounded">
                        <Trash />
                    </button>
                </div>
            ))}
            <button onClick={onAddField} className="flex gap-1 items-center px-3.5 py-2 bg-[#6B66F7] rounded text-white mt-4">
                <Add />
                Add Attribute
            </button>
        </>
    );
};

export default PostMetaRepeater;