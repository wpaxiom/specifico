/* global specificoAdminSettings */
import React, { useState, useEffect } from 'react';
import Api from "./Utilites/Api";
import Logo from "./components/Icons/Logo"
import Check from "./components/Icons/Check";
import MappingRepeater from "./components/MappingRepeater";
import MappingLoader from "./components/Loader/MappingLoader";

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

    return (
        <div className="font-['Nunito'] text-sm mt-5 mr-5 relative">
            <div>
                <div className="flex bg-white drop-shadow-[0_0_4px_rgba(26,26,26,0.15)] px-5 py-4 mb-5 items-center rounded">
                    <div className="flex flex-auto gap-3 items-center">
                        <Logo/>
                        <div>
                            <h1 className="text-lg font-semibold text-[#333333]">Specification Mapping</h1>
                            <p className="text-[#555555]">Here are you can map your specification tables.</p>
                        </div>
                    </div>
                    <div className="flex-initial text-right">
                        <button className="flex gap-1 items-center px-3.5 py-2 bg-[#6B66F7] rounded text-white" onClick={() => updateData()}>
                            Save Mapping
                        </button>
                    </div>
                </div>
            </div>
            <div>
                <div className="bg-white drop-shadow-[0_0_4px_rgba(26,26,26,0.15)] mb-5 items-center rounded">
                <div className="bg-[#F5F5FE] px-5 py-4 text-[15px] font-semibold rounded-tl rounded-tr flex flex-auto">
                    <div className="w-1/3">Specifications</div>
                    <div className="w-1/3">Type</div>
                    <div className="w-1/3">Values</div>
                </div>
                <div className="pb-5 px-5">
                    { ! isLoading &&
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
                        }
                        { isLoading &&
                            <MappingLoader count={specificoAdminSettings.mapping} />
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Attributes;