import React from 'react';
import MultiSelect from "../MultiSelect";

const MAP_GRID = "1fr 1fr 1.3fr 48px";

const MappingRepeater = ({ metaFields, onAddField, onChange, onRemoveField, onChangeType, spec, type, optionsByType = {} }) => {
    return (
        <>
            {metaFields.map((field, index) => (
                <div key={index} className="grid gap-3.5 items-center px-6 py-4 border-b border-[#F3F3F8]" style={{ gridTemplateColumns: MAP_GRID }}>
                    <MultiSelect bare placeholder="Select specification" value={field.category} onChange={e => onChange(index, 'category', e)} options={spec}/>
                    <MultiSelect bare placeholder="Select type" value={field.type} onChange={e => onChangeType(index, 'type', e)} options={type}/>
                    <MultiSelect bare isMulti placeholder="Select values" value={field.values} onChange={e => onChange(index, 'values', e)} options={ optionsByType[ field.type?.value ] || [] } isDisabled={ ! field.type?.value }/>
                    <button type="button" onClick={() => onRemoveField(index)} aria-label="Remove mapping" className="inline-flex items-center justify-center w-[38px] h-[38px] border border-[#F4DADA] bg-[#FEF6F6] rounded-[10px] hover:bg-[#FCEAEA] transition-colors">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            ))}
            <div className="px-6 py-[18px]">
                <button type="button" onClick={onAddField} className="inline-flex items-center gap-[7px] h-[38px] px-4 bg-[#EDEBFF] text-[#6B66F7] border-none rounded-[10px] font-bold text-[13.5px] cursor-pointer hover:bg-[#E2DFFF] transition-colors">
                    <span className="text-[17px] leading-none -mt-px">+</span> Add Mapping
                </button>
            </div>
        </>
    );
};

export default MappingRepeater;
