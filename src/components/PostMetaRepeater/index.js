import React from 'react';
import Select from "../Select";

const FIELD = "w-full !h-[38px] !min-h-[38px] box-border !border !border-[#E7E7EF] !rounded-[10px] !bg-white !px-[13px] !py-0 !m-0 font-medium !text-[13px] !text-[#23232E] !shadow-none !outline-none focus:!border-[#6B66F7] focus:!shadow-[0_0_0_3px_rgba(107,102,247,0.16)] focus:!ring-0";

const ATTRIBUTE_TYPES = [
    { label: "Text", value: "text" },
    { label: "Select", value: "select" },
    { label: "Radio", value: "radio" },
    { label: "Textarea", value: "textarea" },
];

const PostMetaRepeater = ({ metaFields, onAddField, onChange, onRemoveField }) => {
    return (
        <>
            {metaFields.map((field, index) => (
                <div key={index} className="grid grid-cols-[1fr_1fr_1fr_48px] gap-3.5 items-center px-6 py-3.5 border-b border-[#F3F3F8]">
                    <input type="text" value={field.attributeName} onChange={e => onChange(index, 'attributeName', e.target.value)} placeholder="Attribute name" className={FIELD} />
                    <input type="text" value={field.attributeValue} onChange={e => onChange(index, 'attributeValue', e.target.value)} placeholder="Attribute value" className={FIELD} />
                    <div className="flex flex-col gap-2">
                        <Select bare id={`attribute-type-${index}`} value={field.attributeType} onChange={e => onChange(index, 'attributeType', e.target.value)} items={ATTRIBUTE_TYPES} />
                        {(field.attributeType === 'select' || field.attributeType === 'radio') && (
                            <input type="text" value={field.defaultValue} onChange={e => onChange(index, 'defaultValue', e.target.value)} placeholder="Default value" className={FIELD} />
                        )}
                    </div>
                    <button type="button" onClick={() => onRemoveField(index)} aria-label="Remove attribute" className="inline-flex items-center justify-center w-[38px] h-[38px] border border-[#F4DADA] bg-[#FEF6F6] rounded-[10px] hover:bg-[#FCEAEA] transition-colors">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            ))}
            <div className="px-6 py-[18px]">
                <button type="button" onClick={onAddField} className="inline-flex items-center gap-[7px] h-[38px] px-4 bg-[#EDEBFF] text-[#6B66F7] border-none rounded-[10px] font-bold text-[13.5px] cursor-pointer hover:bg-[#E2DFFF] transition-colors">
                    <span className="text-[17px] leading-none -mt-px">+</span> Add Attribute
                </button>
            </div>
        </>
    );
};

export default PostMetaRepeater;
