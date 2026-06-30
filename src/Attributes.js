/* global specificoAdminSettings */
import React, { useState, useEffect } from 'react';
import Api from "./Utilites/Api";
import Logo from "./components/Icons/Logo"
import MappingRepeater from "./components/MappingRepeater";

const Attributes = () => {
    const [ attributes, setAttributes ] = useState([
        {
            category: { value: '', label: '' },
            type: { value: '', label: '' }
        }
    ]);

    const [ spec, setSpec ] = useState();
    const [ type, setType ] = useState();
    // Value options cached per type value, e.g. { 'product-category': [...] }.
    const [ optionsByType, setOptionsByType ] = useState({});

    const [ isLoading, setIsLoading ] = useState( false );

    // Fetch posts on component mount
    useEffect(() => {
        fetchData();
        fetchSpec();
        fetchType();
    }, []);

    const fetchType = () => {
        const data = [
            {
                "value": "product-id",
                "label": "Product ID"
            },
            {
                "value": "product-name",
                "label": "Product Name"
            },
            {
                "value": "product-category",
                "label": "Product Category"
            },
            {
                "value": "product-tag",
                "label": "Product Tag"
            },
        ];
        setType( data );
    }

    const fetchSpec = async () => {
        try {
            setIsLoading( true );
            const response = await Api.get('/specifico/v1/specification/select');
            if ( response.data ) {
                setSpec(response.data);
            }
        } catch (error) {
            console.error('Error fetching groups:', error);
        } finally {
            setIsLoading( false );
        }
    };

    // Fetch (and cache) the selectable values for a given mapping type.
    const fetchOptionsForType = async ( typeValue ) => {
        if ( ! typeValue ) {
            return;
        }
        try {
            let options = [];
            if ( typeValue === 'product-id' ) {
                const response = await Api.get('/wp/v2/product?_fields=id');
                options = response.data.map( ( item ) => ({ label: item.id, value: item.id }) );
            } else if ( typeValue === 'product-name' ) {
                const response = await Api.get('/wp/v2/product?_fields=id,title');
                options = response.data.map( ( item ) => ({ label: item.title.rendered, value: item.id }) );
            } else if ( typeValue === 'product-category' ) {
                const response = await Api.get('/specifico/v1/categories');
                options = response.data || [];
            } else if ( typeValue === 'product-tag' ) {
                const response = await Api.get('/specifico/v1/tags');
                options = response.data || [];
            }
            setOptionsByType( ( prev ) => ({ ...prev, [ typeValue ]: options }) );
        } catch ( error ) {
            console.error( 'Error fetching values for type:', typeValue, error );
        }
    };

    const fetchData = async () => {
        try {
            setIsLoading( true );
            const response = await Api.get('/specifico/v1/mapping');
            if ( response.data ) {
                setAttributes(response.data);
                // Preload value options for every type already used in saved rows,
                // so existing mappings are immediately editable (not locked).
                const usedTypes = [ ...new Set( response.data.map( ( row ) => row?.type?.value ).filter( Boolean ) ) ];
                usedTypes.forEach( ( t ) => fetchOptionsForType( t ) );
            }
        } catch (error) {
            console.error('Error fetching groups:', error);
        } finally {
            setIsLoading( false );
        }
    };

    const updateData = async () => {
        try {
            setIsLoading( true );
            const response = await Api.put(
                `/specifico/v1/mapping`, attributes
            );
            await fetchData(); // Fetch posts again to update the list
        } catch (error) {
            console.error('Error updating group:', error);
        } finally {
            setIsLoading( false );
        }
    };

    const handleAddField = () => {
        setAttributes([...attributes, { category: { value: '', label: '' }, type: { value: '', label: '' } }]);
    };

    const handleTypeChange = async (index, field, value) => {
        const updatedFields = [...attributes];
        updatedFields[index][field] = value;
        // Changing the type invalidates any previously selected values.
        updatedFields[index].values = [];
        setAttributes(updatedFields);

        fetchOptionsForType( value?.value );
    };

    const handleChange = (index, field, value) => {
        const updatedFields = [...attributes];
        updatedFields[index][field] = value;
        setAttributes(updatedFields);
    };

    const handleRemoveField = (index) => {
        const updatedFields = [...attributes];
        updatedFields.splice(index, 1);
        setAttributes(updatedFields);
    };

    const CARD = "bg-white border border-[#ECECF3] rounded-2xl shadow-[0_1px_2px_rgba(20,20,45,0.04),0_18px_40px_-24px_rgba(30,28,80,0.18)]";

    return (
        <div className="font-['Nunito'] text-sm mt-5 mr-5 relative text-[#54546A]">
            {/* page header card */}
            <div className={`${CARD} flex items-center justify-between gap-4 px-6 py-[18px] mb-5`}>
                <div className="flex items-center gap-[15px]">
                    <span className="w-10 [&_svg]:w-10 [&_svg]:h-auto block"><Logo /></span>
                    <div>
                        <div className="font-extrabold text-[19px] text-[#23232E] tracking-[-0.2px]">Specification Mapping</div>
                        <div className="font-medium text-[13px] text-[#9A9AAE] mt-0.5">Map specification tables to your products.</div>
                    </div>
                </div>
                <div className="flex-none">
                    <button type="button" onClick={() => updateData()} className="whitespace-nowrap inline-flex items-center gap-[7px] h-[38px] px-[18px] bg-[#6B66F7] text-white border-none rounded-[11px] font-bold text-[13.5px] cursor-pointer shadow-[0_5px_14px_-4px_rgba(107,102,247,0.55)] hover:bg-[#5a55e8] transition-colors">
                        Save Mapping
                    </button>
                </div>
            </div>

            <div className={`${CARD} overflow-hidden`}>
                <div className="grid gap-3.5 px-6 py-3.5 border-b border-[#EFEFF4] font-bold text-[10.5px] tracking-[0.09em] uppercase text-[#A2A2B4]" style={{ gridTemplateColumns: "1fr 1fr 1.3fr 48px" }}>
                    <span>Specifications</span><span>Type</span><span>Values</span><span></span>
                </div>
                { ! isLoading ?
                    <MappingRepeater
                        metaFields={attributes}
                        onAddField={handleAddField}
                        onChange={handleChange}
                        onRemoveField={handleRemoveField}
                        onChangeType={handleTypeChange}
                        spec={spec}
                        type={type}
                        optionsByType={optionsByType}
                    />
                    :
                    [0,1,2].map(k =>
                        <div className="grid gap-3.5 items-center px-6 py-4 border-b border-[#F3F3F8]" style={{ gridTemplateColumns: "1fr 1fr 1.3fr 48px" }} key={k}>
                            <span className="h-[38px] rounded-[10px] bg-[#ECEBFF] animate-pulse" />
                            <span className="h-[38px] rounded-[10px] bg-[#ECEBFF] animate-pulse" />
                            <span className="h-[38px] rounded-[10px] bg-[#ECEBFF] animate-pulse" />
                            <span className="h-[38px] w-[38px] rounded-[10px] bg-[#ECEBFF] animate-pulse" />
                        </div>
                    )
                }
            </div>
        </div>
    );
};

export default Attributes;