/* global specificoAdminSettings */
import React, { useState, useEffect } from 'react';
import Api from "../Utilites/Api";
import Logo from "../components/Icons/Logo";
import Switch from "../components/Switch";
import MultiSelect from "../components/MultiSelect";
import Form from "../components/Form";
import SettingsLoader from "../components/Loader/SettingsLoader";

const Settings = () => {

    const [ loader , setLoader ] = useState('Save Setting');
    const [ btnClass , setBtnClass ] = useState('');

    const [ isLoading, setIsLoading ] = useState( true );

    const [ enableSubHeading, setEnableSubHeading] = useState( true );
    const [ styles, setStyles ] = useState({ value: 'style-1', label: 'Style 1' } );

    const styleOptions = [
        { value: 'striped-table', label: 'Striped Table' },
        { value: 'bordered-table', label: 'Bordered Table' },
        { value: 'hoverable-table', label: 'Hoverable Table' },
        { value: 'condensed-table', label: 'Condensed Table' },
        { value: 'colored-table', label: 'Colored Table' }
    ];
    const handleSubmit = ( e ) => {
        e.preventDefault();

        setLoader( 'Updating...' );
        setBtnClass( 'saving' );

        Api.post( '/specifico/v1/settings', {
            enable_sub_heading: enableSubHeading,
            styles: styles,
        }).then( ( res ) => {
            setLoader( 'Save Setting' );
            setBtnClass( '' );
        } );
    }

    useEffect( () => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            Api.get( '/specifico/v1/settings' ). then( ( res ) => {
                setIsLoading( true );

                setEnableSubHeading( res.data.enable_sub_heading )
                setStyles( res.data.styles );
            }).then( ( res ) => {
                setIsLoading( false );
            } );
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    }

    return (
        <div className="font-['Nunito'] text-sm mt-5 mr-5 relative">
            <div>
                <div className="flex bg-white drop-shadow-[0_0_4px_rgba(26,26,26,0.15)] px-5 py-4 mb-5 items-center rounded">
                    <div className="flex flex-auto gap-3 items-center">
                        <Logo/>
                        <div>
                            <h1 className="text-lg font-semibold text-[#333333]">Specification Settings</h1>
                            <p className="text-[#555555]">Here are you can manage global settings for product specifications.</p>
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <div className="bg-white drop-shadow-[0_0_4px_rgba(26,26,26,0.15)] mb-5 items-center rounded">

                        <Form onSubmit={ (e) => { handleSubmit( e ) } }>
                        <div className="bg-[#F5F5FE] px-5 py-4 text-[15px] font-semibold rounded-tl rounded-tr flex flex-auto">
                            Specifico Settings
                        </div>
                            { ! isLoading &&
                                <div className="px-5 pb-5">
                                    <div className="relative before:content-'' before:w-full before:h-px before:bg-dash-border before:bg-repeat-x before:absolute before:bottom-0">
                                        <Switch id="_specifico_settings[enable_sub_heading]" name="_specifico_settings[enable_sub_heading]" placeholder="Enable Group Heading" checked={enableSubHeading} onChange={ () => setEnableSubHeading((prev) => !prev) }/>
                                    </div>
                                    <div className="relative before:content-'' before:w-full before:h-px before:bg-dash-border before:bg-repeat-x before:absolute before:bottom-0">
                                        <MultiSelect id="_specifico_settings[default_styles]" name="_specifico_settings[default_styles]" value={styles} onChange={ (e) => setStyles( e )} options={styleOptions} placeholder="Specification Styles"/>
                                    </div>
                                    <button type="submit" className={ "flex gap-1 items-center px-3.5 py-2.5 bg-[#6B66F7] rounded text-white mt-5 " + btnClass } disabled={ !!btnClass }>
                                        <span>{loader}</span>
                                    </button>
                                </div>
                            }
                            {
                                isLoading &&
                                <SettingsLoader />
                            }
                    </Form>
                </div>
            </div>
        </div>
    );
};

export default Settings;