/* global specificoAdminSettings */

import React, { useState, useEffect } from 'react';
import Api from "./../Utilites/Api";
import Switch from "../components/Switch";
import MultiSelect from "../components/MultiSelect";
import Remove from "../components/Icons/Remove";
import Trash from "../components/Icons/Trash";
import Add from "../components/Icons/Add";
import TextInput from "../components/TextInput";
import Rotate from "../components/Icons/Rotate";

const Options = () => {
    const [status, setStatus] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [hasGroup, setHasGroup] = useState(true);

    const [typeLabel, setTypeLabel] = useState('Default');
    const [typeVal, setTypeVal] = useState({ value: 'default', label: 'Default' });

    const [specLabel, setSpecLabel] = useState();
    const [specVal, setSpecVal] = useState([]);
    const [selectedSpec, setSelectedSpec] = useState();

    const [accordions, setAccordions] = useState([]);
    const [activeAccordion, setActiveAccordion] = useState(null);

    // Fetch initial data on component mount
    useEffect(() => {
        const fetchData = async () => {
            //setIsLoading(true);
            await fetchSpec();
            await fetchOption();
            await fetchHasGroup();
            //await fetchDefaultTable();
            //setIsLoading(false);
        };

        fetchData();
    }, []);

    const types = [
        { value: 'default', label: 'Default' },
        { value: 'table', label: 'Predefined Table' },
        { value: 'custom', label: 'Custom' }
    ];

    const fetchHasGroup = async () => {
        const id = specificoAdminSettings.post_id;
        try {
            const response = await Api.get(`/specifico/v1/option/group/${id}`);
            setHasGroup(response.data ? true : false);
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    };

    const resetOptions = async (e) => {
        e.preventDefault();
        const id = specificoAdminSettings.post_id;
        try {
            await Api.delete(`/specifico/v1/option/group/${id}`);
            setHasGroup(false);
            await fetchSpec();
            await fetchTables();
            await fetchOption();
        } catch (error) {
            console.error('Error resetting options:', error);
        }
    };

    const fetchOption = async () => {
        const id = specificoAdminSettings.post_id;
        try {
            const response = await Api.get(`/specifico/v1/option/${id}`);
            //setIsLoading( true );

            if (response.data) {
                setStatus(response.data.spec);
                setTypeLabel(response.data.type.label);
                setTypeVal(response.data.type);
                setSpecLabel(response.data.table?.label);
                setSelectedSpec(response.data.table);

                // Set accordions only if groups exist and are an array
                if (response.data.groups && Array.isArray(response.data.groups)) {
                    setAccordions(response.data.groups);
                } else {
                    setAccordions([]);
                }
            }
        } catch (error) {
            console.error('Error fetching options:', error);
        }
    };

    const fetchSpec = async () => {
        try {
            const response = await Api.get('/specifico/v1/specification/select');
            if (response.data) {
                setSpecVal(response.data);
            }
        } catch (error) {
            console.error('Error fetching specifications:', error);
        }
    };

    const handleTypeChange = async (option) => {
        setTypeLabel(option.label);
        setTypeVal(option);

        if (option.value === 'default') {
            await fetchDefaultTable();
        } else if (option.value === 'custom') {
            setAccordions([{
                id: Date.now(),
                title: '',
                inputGroups: [[{ id: 1, value: '' }, { id: 2, value: '' }]]
            }]);
        } else {
            setAccordions([]);
        }
    };

    const fetchDefaultTable = async () => {
        const id = specificoAdminSettings.post_id;
        try {
            //setIsLoading( true );
            const response = await Api.get(`/specifico/v1/attribute/default/${id}`);

            // Log the response to debug
            console.log('Default Table Response:', response);

            if (response.data) {
                // Assuming response.data is an array of accordion groups
                setAccordions(response.data);
            } else {
                setAccordions([]); // Reset accordions if no data
            }
        } catch (error) {
            console.error('Error fetching default table:', error);
            setAccordions([]); // Reset accordions on error
        } finally {
            //setIsLoading( false );
        }
    };

    const handleSpecChange = async (option) => {
        setSpecLabel(option.label);
        setSelectedSpec(option);
        await fetchTables(option.value);
    };

    const fetchTables = async (specId) => {
        if (specId) {
            const response = await Api.get(`/specifico/v1/attribute/${specId}`);
            setAccordions(response.data);
        }
    };

    const addAccordion = (e) => {
        e.preventDefault();
        const newAccordion = {
            id: Date.now(),
            title: `Accordion ${accordions.length + 1}`,
            inputGroups: [
                [{ id: Date.now() + 1, value: '' }, { id: Date.now() + 2, value: '' }]
            ]
        };
        setAccordions([...accordions, newAccordion]);
    };

    const removeAccordion = (accordionId, e) => {
        e.preventDefault();
        setAccordions(accordions.filter(acc => acc.id !== accordionId));
    };

    const addInputGroup = (accordionId, e) => {
        e.preventDefault();
        const updatedAccordions = accordions.map(acc => {
            if (acc.id === accordionId) {
                return {
                    ...acc,
                    inputGroups: [...acc.inputGroups, [{ id: Date.now(), value: '' }, { id: Date.now() + 1, value: '' }]]
                };
            }
            return acc;
        });
        setAccordions(updatedAccordions);
    };

    const removeInputGroup = (accordionId, groupId, e) => {
        e.preventDefault();
        const updatedAccordions = accordions.map(acc => {
            if (acc.id === accordionId) {
                return {
                    ...acc,
                    inputGroups: acc.inputGroups.filter((group, index) => index !== groupId)
                };
            }
            return acc;
        });
        setAccordions(updatedAccordions);
    };

    const handleInputChange = (accordionId, groupId, inputId, value) => {
        const updatedAccordions = accordions.map(acc => {
            if (acc.id === accordionId) {
                return {
                    ...acc,
                    inputGroups: acc.inputGroups.map((group, index) => {
                        if (index === groupId) {
                            return group.map(inp => {
                                if (inp.id === inputId) {
                                    return { ...inp, value };
                                }
                                return inp;
                            });
                        }
                        return group;
                    })
                };
            }
            return acc;
        });
        setAccordions(updatedAccordions);
    };

    const toggleAccordion = (accordionId) => {
        setActiveAccordion(activeAccordion === accordionId ? null : accordionId);
    };

    const handleAccordionTitleChange = (accordionId, value) => {
        setAccordions(accordions.map(acc => {
            if (acc.id === accordionId) {
                return { ...acc, title: value };
            }
            return acc;
        }));
    };


    return (
        <>
            {
                isLoading &&
                <div>Loading</div>
            }
            {
                ! isLoading &&
                <div>
                    <div className="relative group">
                        <input type="hidden" name="nonce" value={specificoAdminSettings.nonce}/>
                        {
                            hasGroup &&
                            <div className="bg-blue-50 p-4 rounded-lg drop-shadow-[0_0_4px_rgba(26,26,26,0.15)] w-full h-auto flex items-center">
                                <p className="text-gray-700 flex-1 mr-4">
                                    To change the Specification Type, please clear the saved value first.
                                </p>
                                <button onClick={resetOptions} className="bg-blue-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-800 transition duration-200">
                                    Clear Now
                                </button>
                            </div>
                        }
                        <Switch id="_specifico_spec" name="_specifico_spec" placeholder="Enable Specification" checked={status} onChange={() => setStatus((prev) => !prev)} />
                        <input type="hidden" id="_specifico_type[label]" name="_specifico_type[label]" value={typeLabel} />
                        <MultiSelect id="_specifico_type[value]" name="_specifico_type[value]" placeholder="Specification Type" onChange={handleTypeChange} options={types} value={typeVal} isDisabled={ hasGroup } />
                        {
                            typeVal.value === 'table' && (
                                <>
                                    <input type="hidden" id="_specifico_table[label]" name="_specifico_table[label]" value={specLabel} />
                                    <MultiSelect id="_specifico_table[value]" name="_specifico_table[value]" placeholder="Specifications" value={selectedSpec} onChange={handleSpecChange} options={specVal} />
                                </>
                            )
                        }
                    </div>

                    {
                        typeVal.value && accordions.length > 0 &&
                        <div className="border-t border-[#E9E8FE] pt-5">
                            {accordions.map((accordion, accordionIndex) => (
                                <div key={accordion.id} className="bg-white drop-shadow-[0_0_4px_rgba(26,26,26,0.15)] mb-5">
                                    <div onClick={() => toggleAccordion(accordion.id)} className="cursor-pointer bg-[#F5F5FE] py-3 px-5 relative">
                                        <input type="hidden" id={`_specifico_groups[${accordionIndex}][id]`} name={`_specifico_groups[${accordionIndex}][id]`} value={accordion.id} />
                                        <input type="hidden" id={`_specifico_groups[${accordionIndex}][title]`} name={`_specifico_groups[${accordionIndex}][title]`} value={accordion.title} />
                                        {accordion.title} {activeAccordion === accordion.id ? '-' : '+'}
                                        <button onClick={(e) => removeAccordion(accordion.id, e)} className="absolute right-5 top-2/4 translate-y-[-50%]"><Remove /></button>
                                    </div>
                                    {accordion.inputGroups.map((group, groupIndex) => (
                                        <div key={groupIndex} >
                                            {group.map( (input, index) => (
                                                <>
                                                    <input type="hidden" id={"_specifico_groups[" + accordionIndex + "][inputGroups][" + groupIndex + "][" + index + "][id]"} name={"_specifico_groups[" + accordionIndex + "][inputGroups][" + groupIndex + "][" + index + "][id]"} value={index + 1} />
                                                    <input type="hidden" id={"_specifico_groups[" + accordionIndex + "][inputGroups][" + groupIndex + "][" + index + "][value]"} name={"_specifico_groups[" + accordionIndex + "][inputGroups][" + groupIndex + "][" + index + "][value]"} value={input.value} />
                                                </>
                                            ))}
                                        </div>
                                    ))
                                    }
                                    {activeAccordion === accordion.id && (
                                        <div className="p-2.5">
                                            <TextInput placeholder="Group Name" value={accordion.title} onChange={(e) => handleAccordionTitleChange(accordion.id, e.target.value)} className="border-b border-[#E9E8FE] !p-0 !pb-3 min-h-0" />
                                            <div className="mt-3">
                                                {accordion.inputGroups.map((group, groupIndex) => (
                                                    <div key={groupIndex} className="flex gap-2.5 mb-2.5">
                                                        {group.map((input, index) => (
                                                            <>
                                                                <TextInput hasLabel={false} key={input.id} type="text" value={input.value} onChange={(e) => handleInputChange(accordion.id, groupIndex, input.id, e.target.value)} className="!p-0 min-h-9" />
                                                            </>
                                                        ))}
                                                        <button onClick={(e) => removeInputGroup(accordion.id, groupIndex, e)} className="p-[7px] w-9 h-9 bg-[#FBFCFD] border border-[#E9E8FE] rounded">
                                                            <Trash />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <button onClick={(e) => addInputGroup(accordion.id, e)} className="flex gap-1 items-center px-3.5 py-2.5 bg-[#6B66F7] rounded text-white">
                                                <Add />
                                                Add Attribute
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <button onClick={addAccordion} className="flex gap-1 items-center px-3.5 py-2.5 bg-[#6B66F7] rounded text-white">
                                <Add />
                                Add Group
                            </button>
                        </div>
                    }
                </div>
            }
        </>
    );
};

export default Options;
