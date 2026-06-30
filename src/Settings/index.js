/* global specificoAdminSettings */
import React, { useState, useEffect } from 'react';
import Api from "../Utilites/Api";
import Logo from "../components/Icons/Logo";
import Switch from "../components/Switch";
import Select from "../components/Select";
import Form from "../components/Form";
import SettingsLoader from "../components/Loader/SettingsLoader";

const CARD = "bg-white border border-[#ECECF3] rounded-2xl shadow-[0_1px_2px_rgba(20,20,45,0.04),0_18px_40px_-24px_rgba(30,28,80,0.18)]";
const FIELD = "w-full !h-[38px] !min-h-[38px] box-border !border !border-[#E7E7EF] !rounded-[10px] !bg-white !px-[14px] !py-0 !m-0 font-medium !text-[14px] !text-[#23232E] !shadow-none !outline-none focus:!border-[#6B66F7] focus:!shadow-[0_0_0_3px_rgba(107,102,247,0.16)] focus:!ring-0";

const Settings = () => {

    const [ loader , setLoader ] = useState('Save Settings');
    const [ btnClass , setBtnClass ] = useState('');

    const [ isLoading, setIsLoading ] = useState( true );

    const [ enableSubHeading, setEnableSubHeading] = useState( true );
    const [ styles, setStyles ] = useState({ value: 'style-1', label: 'Style 1' } );
    const [ tabTitle, setTabTitle ] = useState( '' );
    const [ wcAdditionalInfo, setWcAdditionalInfo ] = useState( 'keep' );

    const styleOptions = [
        { value: 'striped-table', label: 'Striped Table' },
        { value: 'bordered-table', label: 'Bordered Table' },
        { value: 'hoverable-table', label: 'Hoverable Table' },
        { value: 'condensed-table', label: 'Condensed Table' },
        { value: 'colored-table', label: 'Colored Table' }
    ];

    const wcTabOptions = [
        { value: 'keep', label: 'Keep it' },
        { value: 'remove', label: 'Always remove' },
        { value: 'remove_if_specs', label: 'Remove when product has specifications' }
    ];
    const handleSubmit = ( e ) => {
        e.preventDefault();

        setLoader( 'Updating...' );
        setBtnClass( 'saving' );

        Api.post( '/specifico/v1/settings', {
            enable_sub_heading: enableSubHeading,
            styles: styles,
            tab_title: tabTitle,
            wc_additional_info: wcAdditionalInfo,
        }).then( ( res ) => {
            setLoader( 'Save Settings' );
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
                setTabTitle( res.data.tab_title || '' );
                setWcAdditionalInfo( res.data.wc_additional_info || 'keep' );
            }).then( ( res ) => {
                setIsLoading( false );
            } );
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    }

    const Row = ( { title, desc, children, last } ) => (
        <div className={ "grid grid-cols-[300px_1fr] items-center gap-5 px-6 py-[18px]" + ( last ? "" : " border-b border-[#F3F3F8]" ) }>
            <div>
                <div className="font-bold text-[13px] text-[#3A3A45]">{title}</div>
                <div className="font-medium text-[12px] text-[#9A9AAE] mt-0.5">{desc}</div>
            </div>
            <div>{children}</div>
        </div>
    );

    return (
        <div className="font-['Nunito'] text-sm mt-5 mr-5 relative text-[#54546A]">
            {/* page header card */}
            <div className={`${CARD} flex items-center gap-[15px] px-6 py-[18px] mb-5`}>
                <span className="w-10 [&_svg]:w-10 [&_svg]:h-auto block"><Logo /></span>
                <div>
                    <div className="font-extrabold text-[19px] text-[#23232E] tracking-[-0.2px]">Specification Settings</div>
                    <div className="font-medium text-[13px] text-[#9A9AAE] mt-0.5">Manage global settings for product specifications.</div>
                </div>
            </div>

            <div className={`${CARD} overflow-hidden`}>
                <Form onSubmit={ (e) => { handleSubmit( e ) } }>
                    <div className="px-6 py-4 border-b border-[#EFEFF4] font-extrabold text-[15px] text-[#23232E]">Specifico Settings</div>
                    { ! isLoading ?
                        <>
                            <Row title="Enable Group Heading" desc="Show group titles as section headers in the spec table.">
                                <Switch bare id="_specifico_settings[enable_sub_heading]" name="_specifico_settings[enable_sub_heading]" checked={enableSubHeading} onChange={ () => setEnableSubHeading((prev) => !prev) } />
                            </Row>
                            <Row title="Specification Styles" desc="Visual style for the rendered table.">
                                <Select bare id="_specifico_settings[default_styles]" className="!max-w-[420px]" value={ styles?.value || '' } onChange={ (e) => { const opt = styleOptions.find( ( o ) => o.value === e.target.value ); setStyles( opt || { value: e.target.value, label: e.target.value } ); } } items={styleOptions} />
                            </Row>
                            <Row title="Specifications Tab Title" desc="Heading for the specifications product tab.">
                                <input id="_specifico_settings[tab_title]" type="text" value={tabTitle} onChange={ (e) => setTabTitle( e.target.value )} placeholder="Specifications" className={FIELD} />
                            </Row>
                            <Row title="Additional Information Tab" desc="Control WooCommerce’s default info tab." last>
                                <Select bare id="_specifico_settings[wc_additional_info]" className="!max-w-[420px]" value={wcAdditionalInfo} onChange={ (e) => setWcAdditionalInfo( e.target.value )} items={wcTabOptions} />
                            </Row>
                            <div className="px-6 py-[18px] border-t border-[#F3F3F8]">
                                <button type="submit" className={ "h-[38px] px-[18px] bg-[#6B66F7] text-white border-none rounded-[10px] font-bold text-[13.5px] cursor-pointer shadow-[0_5px_14px_-4px_rgba(107,102,247,0.55)] hover:bg-[#5a55e8] transition-colors disabled:opacity-60 " + btnClass } disabled={ !!btnClass }>
                                    <span>{loader}</span>
                                </button>
                            </div>
                        </>
                        :
                        <SettingsLoader />
                    }
                </Form>
            </div>
        </div>
    );
};

export default Settings;
