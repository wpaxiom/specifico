import React, {useEffect, useState} from 'react';
import TextInput from "../components/TextInput";
import Api from "../Utilites/Api";
import Remove from "../components/Icons/Remove";
import Trash from "../components/Icons/Trash";
import Add from "../components/Icons/Add";

const AttrRepeater = ({type, spec}) => {
    const [accordions, setAccordions] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        if ( 'table' === type.value ) {
            const response = await Api.get(`/specifico/v1/attribute/${spec.value}`);
            setAccordions( response.data );
        } else {
            setAccordions(
            [
                    {
                        id: 1,
                        title: 'Accordion normal',
                        inputGroups: [
                            [{ id: 1, value: '' }, { id: 2, value: '' }]
                        ]
                    }
                ]
            )
        }
    }

    const [activeAccordion, setActiveAccordion] = useState(null);

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
        <div className="border-t border-[#E9E8FE] pt-5">
            {accordions.map( ( accordion, accordionIndex ) => (
                <div key={accordion.id} className="bg-white drop-shadow-[0_0_4px_rgba(26,26,26,0.15)] mb-5">
                    <div onClick={() => toggleAccordion(accordion.id)} className="curson-pointer bg-[#F5F5FE] py-3 px-5 relative">
                        <input type="hidden" id={"_specifico_groups[" + accordionIndex + "][id]"} name={"_specifico_groups[" + accordionIndex + "][id]"} value={accordion.id} />
                        <input type="hidden" id={"_specifico_groups[" + accordionIndex + "][title]"} name={"_specifico_groups[" + accordionIndex + "][title]"} value={accordion.title} />
                        {accordion.title} {activeAccordion === accordion.id ? '-' : '+'}
                        <button onClick={(e) => removeAccordion(accordion.id, e)} className="absolute right-5 top-2/4 translate-y-[-50%]"><Remove /></button>
                    </div>
                    {accordion.inputGroups.map((group, groupIndex) => (
                        <div key={groupIndex} >
                            {group.map( (input, index) => (
                                <input type="hidden" id={"_specifico_groups[" + accordionIndex + "][inputGroups][" + groupIndex + "][" + ( index + 1 ) + "][id]"} name={"_specifico_groups[" + accordionIndex + "][inputGroups][" + groupIndex + "][" + ( index + 1 ) + "][id]"} value={input.value} />
                            ))}
                        </div>
                        ))
                    }
                    {activeAccordion === accordion.id && (
                        <div className="p-2.5">
                            <TextInput placeholder="Group Name" value={accordion.title} onChange={(e) => handleAccordionTitleChange(accordion.id, e.target.value)} className="border-b border-[#E9E8FE] !p-0 !pb-3 min-h-0"/>
                            <div className="mt-3">
                            {accordion.inputGroups.map((group, groupIndex) => (
                                <div key={groupIndex} className="flex gap-2.5 mb-2.5">
                                        {group.map( (input, index) => (
                                            <>
                                                <input type="hidden" id={"_specifico_groups[" + accordionIndex + "][inputGroups][" + groupIndex + "][" + ( index + 1 ) + "][id]"} name={"_specifico_groups[" + accordionIndex + "][inputGroups][" + groupIndex + "][" + ( index + 1 ) + "][id]"} value={input.value} />
                                                <TextInput hasLabel={false} key={input.id} type="text" value={input.value} onChange={(e) => handleInputChange(accordion.id, groupIndex, input.id, e.target.value)} className="!p-0 min-h-9"/>
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
                                Add Group
                            </button>
                        </div>
                    )}
                </div>
            ))}
            <button onClick={addAccordion} className="flex gap-1 items-center px-3.5 py-2.5 bg-[#6B66F7] rounded text-white">
                <Add />
                Add Accordion
            </button>
        </div>
    );
};

export default AttrRepeater;
