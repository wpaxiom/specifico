/* global specificoAdminSettings */

import React, { useState, useEffect } from 'react';
import Api from "./../Utilites/Api";
import Switch from "../components/Switch";
import MultiSelect from "../components/MultiSelect";
import Remove from "../components/Icons/Remove";
import Trash from "../components/Icons/Trash";
import Add from "../components/Icons/Add";
import TextInput from "../components/TextInput";

const MATCH_LABEL = {
    'product-id':       'product ID',
    'product-name':     'product',
    'product-category': 'category',
    'product-tag':      'tag',
};

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
        setAccordions([
            ...accordions,
            {
                id: Date.now(),
                title: `New group`,
                inputGroups: [[{ id: Date.now() + 1, value: '' }, { id: Date.now() + 2, value: '' }]],
            },
        ]);
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
        return <div className="p-4 text-[#555555]">Loading…</div>;
    }

    return (
        <div className="font-['Nunito'] text-sm">
            <input type="hidden" name="nonce" value={specificoAdminSettings.nonce} />

            <Switch
                id="_specifico_spec"
                name="_specifico_spec"
                placeholder="Enable specifications for this product"
                checked={status}
                onChange={() => setStatus(prev => !prev)}
            />

            {status && (
                <>
                    <input type="hidden" name="_specifico_override" value={overrideMode} />

                    <div className="mt-5 space-y-3">
                        <ModeCard
                            selected={overrideMode === ''}
                            onClick={chooseInherit}
                            title="Inherit from mapping"
                            subtitle="Use the rule from Specifico → Mapping. Update once, every matching product updates."
                        >
                            {overrideMode === '' && (
                                <InheritPreview
                                    inherited={inherited}
                                    inheritValues={inheritValues}
                                    onInheritValueChange={handleInheritValueChange}
                                />
                            )}
                        </ModeCard>

                        <ModeCard
                            selected={overrideMode === 'custom'}
                            onClick={chooseCustomize}
                            title="Customize for this product"
                            subtitle="Override the mapping with a one-off table just for this product."
                        >
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
                        </ModeCard>
                    </div>

                    {overrideMode === 'custom' && (
                        <HiddenGroupsPayload accordions={accordions} />
                    )}
                    {overrideMode === '' && inherited && (
                        <HiddenInheritValuesPayload inherited={inherited} inheritValues={inheritValues} />
                    )}
                </>
            )}
        </div>
    );
};

const ModeCard = ({ selected, onClick, title, subtitle, children }) => (
    <div
        onClick={onClick}
        className={
            "p-4 rounded border cursor-pointer transition " +
            (selected
                ? "border-[#6B66F7] bg-[#F5F5FE]"
                : "border-[#E9E8FE] bg-white hover:border-[#C9C7FB]")
        }
    >
        <div className="flex items-start gap-3">
            <div className={
                "mt-1 w-4 h-4 rounded-full border-2 flex-shrink-0 " +
                (selected ? "border-[#6B66F7]" : "border-[#C9C7FB]")
            }>
                {selected && <div className="w-2 h-2 bg-[#6B66F7] rounded-full m-auto mt-[2.5px]" />}
            </div>
            <div className="flex-1">
                <div className="text-[15px] font-semibold text-[#333333]">{title}</div>
                <div className="text-[#555555] mt-1">{subtitle}</div>
            </div>
        </div>
        {children && (
            <div className="mt-4 pl-7" onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        )}
    </div>
);

const InheritPreview = ({ inherited, inheritValues, onInheritValueChange }) => {
    const [showFields, setShowFields] = useState(false);

    if (!inherited) {
        return (
            <div className="bg-white border border-[#E9E8FE] rounded p-3">
                <p className="text-[#555555]">
                    No mapping rule matches this product yet.
                    {' '}
                    <a href="admin.php?page=specifico-mapping" className="text-[#6B66F7] underline">
                        Set up a mapping rule
                    </a>
                    {' '}or switch to Customize below.
                </p>
            </div>
        );
    }

    const matchLabel = MATCH_LABEL[inherited.match_type] || inherited.match_type;
    const previewGroups = Array.isArray(inherited.groups) ? inherited.groups : [];

    return (
        <div className="bg-white border border-[#E9E8FE] rounded p-3">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-[#333333]">
                        Will display: <strong>{inherited.table_name}</strong>
                    </div>
                    <div className="text-[#555555] mt-1">
                        Matched via {matchLabel}{inherited.match_value ? <>: <em>{inherited.match_value}</em></> : null}
                    </div>
                </div>
                {previewGroups.length > 0 && (
                    <button
                        type="button"
                        onClick={() => setShowFields(prev => !prev)}
                        className="text-[#6B66F7] underline text-sm flex-shrink-0"
                    >
                        {showFields ? 'Hide fields' : 'Show fields'}
                    </button>
                )}
            </div>

            {showFields && previewGroups.length > 0 && (
                <div className="space-y-4 mt-4">
                    {previewGroups.map((g, gi) => (
                        <div key={gi}>
                            {g.title && (
                                <div className="font-semibold text-[#333333] mb-2">{g.title}</div>
                            )}
                            <div className="space-y-1">
                                {(g.inputGroups || []).map((row, ri) => (
                                    <div key={ri} className="flex gap-2">
                                        <div className="flex-1 px-3 py-2 bg-[#F5F5FE] border border-[#E9E8FE] rounded text-[#555555] text-sm min-h-9 flex items-center">
                                            {row[0]?.value}
                                        </div>
                                        <TextInput
                                            hasLabel={false}
                                            type="text"
                                            value={inheritValues[gi]?.[ri] ?? (row[1]?.value || '')}
                                            onChange={(e) => onInheritValueChange(gi, ri, e.target.value)}
                                            className="!p-0 min-h-9 flex-1"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
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
            <div className="bg-white border border-[#E9E8FE] rounded p-3">
                <div className="text-[#333333] mb-2">Start with:</div>
                <div className="mb-3">
                    <MultiSelect
                        id="specifico-seed"
                        placeholder="Copy from an existing table…"
                        options={specOptions}
                        value={seedTable}
                        onChange={onSeed}
                    />
                </div>
                <button
                    onClick={onStartBlank}
                    type="button"
                    className="text-[#6B66F7] underline text-sm"
                >
                    or start blank
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-[#555555] text-sm">
                    {seedTable ? <>Copied from <strong>{seedTable.label}</strong></> : 'Custom table'}
                </span>
                <button
                    type="button"
                    onClick={onStartOver}
                    className="text-[#6B66F7] underline text-sm"
                >
                    Start over
                </button>
            </div>
            {accordions.map((accordion) => (
                <div key={accordion.id} className="bg-white border border-[#E9E8FE] rounded">
                    <div
                        onClick={() => onToggle(accordion.id)}
                        className="cursor-pointer bg-[#F5F5FE] py-3 px-4 relative flex items-center justify-between rounded-t"
                    >
                        <span className="text-[#333333]">
                            {accordion.title || 'Untitled group'} {activeAccordion === accordion.id ? '−' : '+'}
                        </span>
                        <button
                            type="button"
                            onClick={(e) => onRemove(accordion.id, e)}
                            className="ml-3"
                            aria-label="Remove group"
                        >
                            <Remove />
                        </button>
                    </div>

                    {activeAccordion === accordion.id && (
                        <div className="p-3">
                            <TextInput
                                placeholder="Group name"
                                value={accordion.title}
                                onChange={(e) => onTitleChange(accordion.id, e.target.value)}
                                className="border-b border-[#E9E8FE] !p-0 !pb-3 min-h-0"
                            />
                            <div className="mt-3">
                                {accordion.inputGroups.map((row, rowIndex) => (
                                    <div key={rowIndex} className="flex gap-2 mb-2">
                                        {row.map((input) => (
                                            <TextInput
                                                key={input.id}
                                                hasLabel={false}
                                                type="text"
                                                value={input.value}
                                                onChange={(e) => onValueChange(accordion.id, rowIndex, input.id, e.target.value)}
                                                className="!p-0 min-h-9"
                                            />
                                        ))}
                                        <button
                                            type="button"
                                            onClick={(e) => onRemoveRow(accordion.id, rowIndex, e)}
                                            className="p-[7px] w-9 h-9 bg-[#FBFCFD] border border-[#E9E8FE] rounded"
                                            aria-label="Remove row"
                                        >
                                            <Trash />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={(e) => onAddRow(accordion.id, e)}
                                className="flex gap-1 items-center px-3 py-2 bg-[#6B66F7] rounded text-white text-sm"
                            >
                                <Add />
                                Add attribute
                            </button>
                        </div>
                    )}
                </div>
            ))}
            <button
                type="button"
                onClick={onAdd}
                className="flex gap-1 items-center px-3 py-2 bg-[#6B66F7] rounded text-white text-sm"
            >
                <Add />
                Add group
            </button>
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
