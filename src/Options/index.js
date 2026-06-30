/* global specificoAdminSettings */

import React, { useState, useEffect } from 'react';
import Api from "./../Utilites/Api";
import Switch from "../components/Switch";
import MultiSelect from "../components/MultiSelect";

const MATCH_LABEL = {
    'product-id':       'product ID',
    'product-name':     'product',
    'product-category': 'category',
    'product-tag':      'tag',
};

const META_FIELD = "w-full !h-[38px] !min-h-[38px] box-border !border !border-[#E7E7EF] !rounded-[9px] !bg-white !px-3 !py-0 !m-0 font-medium !text-[13.5px] !text-[#23232E] !shadow-none !outline-none focus:!border-[#6B66F7] focus:!shadow-[0_0_0_3px_rgba(107,102,247,0.16)] focus:!ring-0";

const TrashBtn = ( { onClick, label, size = 38 } ) => (
    <button type="button" onClick={onClick} aria-label={label} className="inline-flex items-center justify-center border border-[#F4DADA] bg-[#FEF6F6] rounded-[8px] hover:bg-[#FCEAEA] transition-colors" style={{ width: size, height: size }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
    </button>
);

const Options = () => {
    const productId = specificoAdminSettings.post_id;

    const [status, setStatus] = useState(false);
    const [overrideMode, setOverrideMode] = useState('');
    const [accordions, setAccordions] = useState([]);
    const [activeAccordion, setActiveAccordion] = useState(null);
    const [inherited, setInherited] = useState(null);
    const [inheritValues, setInheritValues] = useState({});

    const [specOptions, setSpecOptions] = useState([]);
    const [seedTable, setSeedTable] = useState(null);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const bootstrap = async () => {
            await Promise.all([fetchOption(), fetchSpecOptions()]);
            setIsLoading(false);
        };
        bootstrap();
    }, []);

    const fetchOption = async () => {
        try {
            const response = await Api.get(`/specifico/v1/option/${productId}`);
            const d = response.data || {};
            setStatus(!!d.spec);
            setOverrideMode(d.override === 'custom' ? 'custom' : '');
            setAccordions(Array.isArray(d.groups) ? d.groups : []);
            setInherited(d.inherited || null);

            // Pre-populate inherit values: saved overrides take priority, mapping defaults fill the rest
            const savedInheritValues = d.inherit_values || {};
            const mappingGroups = Array.isArray(d.inherited?.groups) ? d.inherited.groups : [];
            const initialInheritValues = {};
            mappingGroups.forEach((group, gi) => {
                initialInheritValues[gi] = {};
                (group.inputGroups || []).forEach((row, ri) => {
                    const saved = savedInheritValues[gi]?.[ri];
                    initialInheritValues[gi][ri] = saved !== undefined ? saved : (row[1]?.value || '');
                });
            });
            setInheritValues(initialInheritValues);
        } catch (e) {
            console.error('Error fetching options:', e);
        }
    };

    const fetchSpecOptions = async () => {
        try {
            const response = await Api.get('/specifico/v1/specification/select');
            setSpecOptions(response.data || []);
        } catch (e) {
            console.error('Error fetching specifications:', e);
        }
    };

    const seedFromTable = async (option) => {
        if (!option) return;
        setSeedTable(option);
        try {
            const response = await Api.get(`/specifico/v1/attribute/${option.value}`);
            setAccordions(Array.isArray(response.data) ? response.data : []);
        } catch (e) {
            console.error('Error seeding from table:', e);
        }
    };

    const startBlank = (e) => {
        e.preventDefault();
        setAccordions([{
            id: Date.now(),
            title: 'New group',
            inputGroups: [[{ id: 1, value: '' }, { id: 2, value: '' }]],
        }]);
    };

    const startOver = (e) => {
        if (e) e.preventDefault();
        setAccordions([]);
        setSeedTable(null);
        setActiveAccordion(null);
    };

    const chooseInherit = () => {
        setOverrideMode('');
    };

    const chooseCustomize = () => {
        setOverrideMode('custom');
    };

    const handleInheritValueChange = (gi, ri, value) => {
        setInheritValues(prev => ({
            ...prev,
            [gi]: { ...(prev[gi] || {}), [ri]: value },
        }));
    };

    const addAccordion = (e) => {
        e.preventDefault();
        const id = Date.now();
        setAccordions([
            ...accordions,
            {
                id,
                title: `New group`,
                inputGroups: [[{ id: id + 1, value: '' }, { id: id + 2, value: '' }]],
            },
        ]);
        setActiveAccordion(id);
    };

    const removeAccordion = (accordionId, e) => {
        e.preventDefault();
        setAccordions(accordions.filter(acc => acc.id !== accordionId));
    };

    const addInputGroup = (accordionId, e) => {
        e.preventDefault();
        setAccordions(accordions.map(acc => acc.id === accordionId
            ? { ...acc, inputGroups: [...acc.inputGroups, [{ id: Date.now(), value: '' }, { id: Date.now() + 1, value: '' }]] }
            : acc));
    };

    const removeInputGroup = (accordionId, groupIndex, e) => {
        e.preventDefault();
        setAccordions(accordions.map(acc => acc.id === accordionId
            ? { ...acc, inputGroups: acc.inputGroups.filter((_, i) => i !== groupIndex) }
            : acc));
    };

    const handleInputChange = (accordionId, groupIndex, inputId, value) => {
        setAccordions(accordions.map(acc => {
            if (acc.id !== accordionId) return acc;
            return {
                ...acc,
                inputGroups: acc.inputGroups.map((row, ri) => {
                    if (ri !== groupIndex) return row;
                    return row.map(inp => inp.id === inputId ? { ...inp, value } : inp);
                }),
            };
        }));
    };

    const handleAccordionTitleChange = (accordionId, value) => {
        setAccordions(accordions.map(acc => acc.id === accordionId ? { ...acc, title: value } : acc));
    };

    const toggleAccordion = (accordionId) => {
        setActiveAccordion(activeAccordion === accordionId ? null : accordionId);
    };

    if (isLoading) {
        return <div className="p-4 text-[#9A9AAE] font-['Nunito']">Loading…</div>;
    }

    return (
        <div className="font-['Nunito'] text-sm text-[#54546A]">
            <input type="hidden" name="nonce" value={specificoAdminSettings.nonce} />

            {/* master toggle */}
            <div className="flex items-center justify-between gap-3.5 px-[15px] py-[13px] bg-[#FAFAFC] border border-[#EFEFF4] rounded-xl">
                <div>
                    <div className="font-bold text-[13.5px] text-[#23232E]">Enable specifications for this product</div>
                    <div className="font-medium text-[12px] text-[#9A9AAE] mt-0.5">Turn on to attach a spec table to this product.</div>
                </div>
                <Switch bare id="_specifico_spec" name="_specifico_spec" checked={status} onChange={() => setStatus(prev => !prev)} />
            </div>

            {status ? (
                <>
                    <input type="hidden" name="_specifico_override" value={overrideMode} />

                    <div className="mt-4 flex flex-col gap-3.5">
                        {/* mode selectors */}
                        <div className="grid grid-cols-2 gap-3">
                            <ModeSelector
                                selected={overrideMode === ''}
                                onClick={chooseInherit}
                                title="Inherit from mapping"
                                subtitle="Use the rule from Specifico → Mapping. Update once, every matching product updates."
                            />
                            <ModeSelector
                                selected={overrideMode === 'custom'}
                                onClick={chooseCustomize}
                                title="Customize for this product"
                                subtitle="Override the mapping with a one-off table just for this product."
                            />
                        </div>

                        {overrideMode === '' && (
                            <InheritPreview
                                inherited={inherited}
                                inheritValues={inheritValues}
                                onInheritValueChange={handleInheritValueChange}
                            />
                        )}

                        {overrideMode === 'custom' && (
                            <CustomEditor
                                accordions={accordions}
                                activeAccordion={activeAccordion}
                                specOptions={specOptions}
                                seedTable={seedTable}
                                onSeed={seedFromTable}
                                onStartBlank={startBlank}
                                onStartOver={startOver}
                                onToggle={toggleAccordion}
                                onAdd={addAccordion}
                                onRemove={removeAccordion}
                                onAddRow={addInputGroup}
                                onRemoveRow={removeInputGroup}
                                onTitleChange={handleAccordionTitleChange}
                                onValueChange={handleInputChange}
                            />
                        )}
                    </div>

                    {overrideMode === 'custom' && (
                        <HiddenGroupsPayload accordions={accordions} />
                    )}
                    {overrideMode === '' && inherited && (
                        <HiddenInheritValuesPayload inherited={inherited} inheritValues={inheritValues} />
                    )}
                </>
            ) : (
                <div className="mt-3.5 p-[18px] border border-dashed border-[#E2DFEF] rounded-xl text-center font-medium text-[12.5px] text-[#9A9AAE]">
                    Specifications are off for this product. Turn the switch on to choose a table.
                </div>
            )}
        </div>
    );
};

const ModeSelector = ({ selected, onClick, title, subtitle }) => (
    <div
        onClick={onClick}
        className={
            "flex gap-[11px] p-[14px] rounded-xl cursor-pointer border-[1.5px] transition-colors " +
            (selected ? "border-[#6B66F7] bg-[#F6F5FF]" : "border-[#EFEFF4] bg-white hover:border-[#C9C7FB]")
        }
    >
        <span className={ "flex-none w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center mt-px " + (selected ? "border-[#6B66F7]" : "border-[#CFCFDD]") }>
            {selected && <span className="w-2 h-2 rounded-full bg-[#6B66F7]" />}
        </span>
        <div>
            <div className="font-extrabold text-[13.5px] text-[#23232E]">{title}</div>
            <div className="font-medium text-[11.5px] leading-[1.45] text-[#9A9AAE] mt-[3px]">{subtitle}</div>
        </div>
    </div>
);

const InheritPreview = ({ inherited, inheritValues, onInheritValueChange }) => {
    const [showFields, setShowFields] = useState(true);

    if (!inherited) {
        return (
            <div className="p-[18px] border border-dashed border-[#E2DFEF] rounded-xl font-medium text-[12.5px] text-[#9A9AAE]">
                No mapping rule matches this product yet.{' '}
                <a href="admin.php?page=specifico-mapping" className="text-[#6B66F7] font-bold">Set up a mapping rule</a>{' '}or switch to Customize.
            </div>
        );
    }

    const matchLabel = MATCH_LABEL[inherited.match_type] || inherited.match_type;
    const previewGroups = Array.isArray(inherited.groups) ? inherited.groups : [];

    return (
        <div className="border border-[#EFEFF4] rounded-xl overflow-hidden">
            <div className="px-4 py-3.5 bg-[#FAFAFC] border-b border-[#EFEFF4] flex items-center justify-between gap-3">
                <div>
                    <div className="font-semibold text-[12.5px] text-[#54546A]">Will display: <b className="text-[#23232E]">{inherited.table_name}</b></div>
                    <div className="font-semibold text-[11.5px] text-[#9A9AAE] mt-[3px]">
                        Matched via {matchLabel}{inherited.match_value ? <>: <span className="text-[#6B66F7]">{inherited.match_value}</span></> : null}
                    </div>
                </div>
                {previewGroups.length > 0 && (
                    <button type="button" onClick={() => setShowFields(prev => !prev)} className="inline-flex items-center gap-1.5 font-bold text-[12px] text-[#6B66F7] flex-none">
                        {showFields ? 'Hide fields' : 'Show fields'}
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ transform: showFields ? 'none' : 'rotate(-90deg)' }}><path d="M3 4.5 6 7.5 9 4.5" stroke="#6B66F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                )}
            </div>

            {showFields && previewGroups.length > 0 && (
                <div className="px-4 pt-1.5 pb-4">
                    {previewGroups.map((g, gi) => (
                        <div key={gi}>
                            {g.title && (
                                <div className="font-bold text-[10.5px] tracking-[0.08em] uppercase text-[#A2A2B4] mt-3.5 mb-2">{g.title}</div>
                            )}
                            <div className="flex flex-col gap-2">
                                {(g.inputGroups || []).map((row, ri) => (
                                    <div key={ri} className="grid grid-cols-[140px_1fr] gap-2.5 items-center">
                                        <span className="font-semibold text-[13px] text-[#A2A2B4] bg-[#F5F5F9] px-[11px] py-2 rounded-lg truncate" title={row[0]?.value}>
                                            {row[0]?.value}
                                        </span>
                                        <input
                                            type="text"
                                            value={inheritValues[gi]?.[ri] ?? (row[1]?.value || '')}
                                            onChange={(e) => onInheritValueChange(gi, ri, e.target.value)}
                                            className={META_FIELD}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    <div className="mt-3 font-medium text-[11.5px] text-[#9A9AAE]">Labels are locked to the mapped table. Edit values here to override them for this product only.</div>
                </div>
            )}
        </div>
    );
};

const CustomEditor = ({
    accordions, activeAccordion, specOptions, seedTable,
    onSeed, onStartBlank, onStartOver, onToggle, onAdd, onRemove, onAddRow, onRemoveRow,
    onTitleChange, onValueChange,
}) => {
    if (accordions.length === 0) {
        return (
            <div className="flex items-center gap-2.5 flex-wrap px-3.5 py-3 bg-[#FAFAFC] border border-[#EFEFF4] rounded-xl">
                <span className="font-bold text-[12.5px] text-[#54546A]">Start with:</span>
                <div className="flex-1 min-w-[180px]">
                    <MultiSelect bare id="specifico-seed" placeholder="Copy from an existing table…" options={specOptions} value={seedTable} onChange={onSeed} />
                </div>
                <span className="font-semibold text-[12.5px] text-[#A2A2B4]">or</span>
                <button onClick={onStartBlank} type="button" className="font-bold text-[12.5px] text-[#6B66F7]">start blank</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {accordions.map((accordion) => {
                const open = activeAccordion === accordion.id;
                if (!open) {
                    const attrCount = accordion.inputGroups?.length || 0;
                    return (
                        <div key={accordion.id} onClick={() => onToggle(accordion.id)} className="flex items-center gap-2.5 px-3.5 py-[11px] border border-[#EFEFF4] rounded-xl bg-white cursor-pointer hover:bg-[#FAFAFB] transition-colors">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: 'rotate(-90deg)' }}><path d="M3 4.5 6 7.5 9 4.5" stroke="#9A9AAE" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            <span className="flex-1 font-bold text-[13px] text-[#23232E]">{accordion.title || 'Untitled group'}</span>
                            <span className="font-semibold text-[12px] text-[#A2A2B4]">{attrCount} attribute{attrCount === 1 ? '' : 's'}</span>
                        </div>
                    );
                }
                return (
                    <div key={accordion.id} className="border border-[#EFEFF4] rounded-xl overflow-hidden">
                        <div className="flex items-center gap-2.5 px-3.5 py-[11px] bg-[#F6F5FF] border-b border-[#EFEFF4]">
                            <button type="button" onClick={() => onToggle(accordion.id)} aria-label="Collapse group">
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5 6 7.5 9 4.5" stroke="#6B66F7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                            <input
                                value={accordion.title}
                                onChange={(e) => onTitleChange(accordion.id, e.target.value)}
                                placeholder="Group name"
                                className="flex-1 !h-8 !min-h-0 box-border !border !border-[#E2DFFF] !bg-white !rounded-lg !px-[11px] !py-0 !m-0 font-bold !text-[13px] !text-[#23232E] !shadow-none !outline-none focus:!border-[#6B66F7] focus:!shadow-[0_0_0_3px_rgba(107,102,247,0.16)] focus:!ring-0"
                            />
                            <TrashBtn onClick={(e) => onRemove(accordion.id, e)} label="Remove group" size={30} />
                        </div>
                        <div className="px-3.5 py-3 flex flex-col gap-[9px]">
                            {accordion.inputGroups.map((row, rowIndex) => (
                                <div key={rowIndex} className="grid grid-cols-[1fr_1fr_32px] gap-[9px] items-center">
                                    {row.map((input) => (
                                        <input
                                            key={input.id}
                                            type="text"
                                            value={input.value}
                                            onChange={(e) => onValueChange(accordion.id, rowIndex, input.id, e.target.value)}
                                            className="!h-9 !min-h-0 box-border !border !border-[#E7E7EF] !bg-white !rounded-lg !px-[11px] !py-0 !m-0 font-medium !text-[13px] !text-[#23232E] !shadow-none !outline-none focus:!border-[#6B66F7] focus:!shadow-[0_0_0_3px_rgba(107,102,247,0.16)] focus:!ring-0"
                                        />
                                    ))}
                                    <button type="button" onClick={(e) => onRemoveRow(accordion.id, rowIndex, e)} aria-label="Remove row" className="inline-flex items-center justify-center w-8 h-8 bg-[#F5F5F9] rounded-lg hover:bg-[#EFE9E9] transition-colors">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="#B4B4C2" strokeWidth="1.6" strokeLinecap="round"/></svg>
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={(e) => onAddRow(accordion.id, e)} className="self-start inline-flex items-center gap-1.5 h-8 px-3 bg-[#EDEBFF] text-[#6B66F7] border-none rounded-lg font-bold text-[12px] cursor-pointer hover:bg-[#E2DFFF] mt-0.5 transition-colors">
                                <span className="text-[15px] leading-none">+</span> Add attribute
                            </button>
                        </div>
                    </div>
                );
            })}
            <div className="flex gap-2.5 mt-0.5">
                <button type="button" onClick={onAdd} className="inline-flex items-center gap-[7px] h-[38px] px-3.5 bg-[#6B66F7] text-white border-none rounded-[9px] font-bold text-[12.5px] cursor-pointer shadow-[0_5px_14px_-4px_rgba(107,102,247,0.55)] hover:bg-[#5a55e8] transition-colors">
                    <span className="text-[16px] leading-none">+</span> Add group
                </button>
                <button type="button" onClick={onStartOver} className="h-[38px] px-3.5 bg-white border border-[#E7E7EF] rounded-[9px] font-bold text-[12.5px] text-[#9A9AAE] cursor-pointer hover:bg-[#F5F5F9] hover:text-[#54546A] transition-colors">Start over</button>
            </div>
        </div>
    );
};

const HiddenGroupsPayload = ({ accordions }) => (
    <>
        {accordions.map((accordion, ai) => (
            <React.Fragment key={accordion.id}>
                <input type="hidden" name={`_specifico_groups[${ai}][id]`} value={accordion.id} />
                <input type="hidden" name={`_specifico_groups[${ai}][title]`} value={accordion.title || ''} />
                {accordion.inputGroups.map((row, ri) => row.map((field, fi) => (
                    <React.Fragment key={`${ri}-${fi}`}>
                        <input
                            type="hidden"
                            name={`_specifico_groups[${ai}][inputGroups][${ri}][${fi}][id]`}
                            value={fi + 1}
                        />
                        <input
                            type="hidden"
                            name={`_specifico_groups[${ai}][inputGroups][${ri}][${fi}][value]`}
                            value={field.value || ''}
                        />
                    </React.Fragment>
                )))}
            </React.Fragment>
        ))}
    </>
);

const HiddenInheritValuesPayload = ({ inherited, inheritValues }) => {
    const previewGroups = Array.isArray(inherited?.groups) ? inherited.groups : [];
    return (
        <>
            {previewGroups.map((g, gi) =>
                (g.inputGroups || []).map((row, ri) => (
                    <input
                        key={`${gi}-${ri}`}
                        type="hidden"
                        name={`_specifico_inherit_values[${gi}][${ri}]`}
                        value={inheritValues[gi]?.[ri] ?? (row[1]?.value || '')}
                    />
                ))
            )}
        </>
    );
};

export default Options;
