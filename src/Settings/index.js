/* global specificoAdminSettings */
import React, { useState, useEffect } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import Api from "../Utilites/Api";
import Logo from "../components/Icons/Logo";
import Switch from "../components/Switch";
import Select from "../components/Select";
import Form from "../components/Form";
import SettingsLoader from "../components/Loader/SettingsLoader";

const CARD = "bg-white border border-[#ECECF3] rounded-2xl shadow-[0_1px_2px_rgba(20,20,45,0.04),0_18px_40px_-24px_rgba(30,28,80,0.18)]";
const FIELD = "w-full !h-[38px] !min-h-[38px] box-border !border !border-[#E7E7EF] !rounded-[10px] !bg-white !px-[14px] !py-0 !m-0 font-medium !text-[14px] !text-[#23232E] !shadow-none !outline-none focus:!border-[#6B66F7] focus:!shadow-[0_0_0_3px_rgba(107,102,247,0.16)] focus:!ring-0";

// Appearance-control helpers. The user edits plain numbers (px is implied by the
// control), so these translate between the friendly number inputs and the CSS
// strings that are actually stored/sanitized/emitted. Blank always means "inherit".
const parseNum = ( val ) => {
    const m = String( val ).trim().match( /-?\d*\.?\d+/ );
    return m ? m[0] : '';
};
const composeUnit = ( n ) => ( String( n ).trim() === '' ? '' : `${ String( n ).trim() }px` );
const parsePadding = ( val ) => {
    const parts = String( val ).trim().split( /\s+/ ).filter( Boolean );
    if ( ! parts.length ) return { v: '', h: '' };
    const v = parseNum( parts[0] );
    const h = parts[1] !== undefined ? parseNum( parts[1] ) : v;
    return { v, h };
};
const composePadding = ( v, h ) => {
    const vv = String( v ).trim();
    const hh = String( h ).trim();
    if ( vv === '' && hh === '' ) return '';
    return `${ vv === '' ? '0' : vv }px ${ hh === '' ? '0' : hh }px`;
};

const Settings = () => {

    const [ loader , setLoader ] = useState( __( 'Save Settings', 'specifico' ) );
    const [ btnClass , setBtnClass ] = useState('');

    const [ isLoading, setIsLoading ] = useState( true );

    const [ enableSubHeading, setEnableSubHeading] = useState( true );
    const [ styles, setStyles ] = useState({ value: 'style-1', label: __( 'Style 1', 'specifico' ) } );
    const [ customStyles, setCustomStyles ] = useState( {} );
    const [ tabTitle, setTabTitle ] = useState( '' );
    const [ wcAdditionalInfo, setWcAdditionalInfo ] = useState( 'keep' );

    // Product comparison. Off by default — merchants opt in.
    const [ enableComparison, setEnableComparison ] = useState( false );
    const [ compareOnSingle, setCompareOnSingle ] = useState( true );
    const [ compareOnArchive, setCompareOnArchive ] = useState( true );
    const [ compareMax, setCompareMax ] = useState( 4 );
    const [ compareHighlight, setCompareHighlight ] = useState( true );
    const [ compareBtnStyle, setCompareBtnStyle ] = useState( 'theme' );
    const [ compareBtnStyles, setCompareBtnStyles ] = useState( {} );
    // Shop/archive-card compare button — styled independently of the single-page one.
    const [ compareBtnStyleArchive, setCompareBtnStyleArchive ] = useState( 'theme' );
    const [ compareBtnStylesArchive, setCompareBtnStylesArchive ] = useState( {} );
    const [ compareTableStyle, setCompareTableStyle ] = useState( 'default' );
    const [ compareTableStyles, setCompareTableStyles ] = useState( {} );
    const [ comparePage, setComparePage ] = useState( 0 );
    // Whether the chosen comparison page actually holds the shortcode.
    const [ pageShortcode, setPageShortcode ] = useState( 'unknown' ); // 'unknown' | 'checking' | 'present' | 'missing'
    const [ pageOptions, setPageOptions ] = useState( [ { value: 0, label: __( 'None (use slide-in drawer)', 'specifico' ) } ] );

    // Which appearance modal is open: null | 'specTable' | 'compareBtn' | 'compareTable'.
    const [ drawer, setDrawer ] = useState( null );

    const styleOptions = [
        { value: 'striped-table', label: __( 'Striped Table', 'specifico' ) },
        { value: 'bordered-table', label: __( 'Bordered Table', 'specifico' ) },
        { value: 'hoverable-table', label: __( 'Hoverable Table', 'specifico' ) },
        { value: 'condensed-table', label: __( 'Condensed Table', 'specifico' ) },
        { value: 'colored-table', label: __( 'Colored Table', 'specifico' ) },
        { value: 'custom', label: __( 'Custom', 'specifico' ) }
    ];

    // Custom appearance fields (edited in the appearance modal). Each maps to a
    // CSS custom property on the frontend; blank = inherit the theme.
    const customStyleGroups = [
        { title: __( 'Spacing & radius', 'specifico' ), fields: [
            { key: 'cell_padding', label: __( 'Cell padding', 'specifico' ), type: 'padding' },
            { key: 'radius', label: __( 'Border radius', 'specifico' ), type: 'unit', placeholder: '0' },
        ] },
        { title: __( 'Colors', 'specifico' ), fields: [
            { key: 'text_color', label: __( 'Text color', 'specifico' ), type: 'color' },
            { key: 'cell_bg', label: __( 'Cell background', 'specifico' ), type: 'color' },
            { key: 'stripe_bg', label: __( 'Row stripe', 'specifico' ), type: 'color' },
            { key: 'border_color', label: __( 'Border color', 'specifico' ), type: 'color' },
        ] },
        { title: __( 'Header', 'specifico' ), fields: [
            { key: 'header_bg', label: __( 'Header background', 'specifico' ), type: 'color' },
            { key: 'header_color', label: __( 'Header text', 'specifico' ), type: 'color' },
            { key: 'header_weight', label: __( 'Header weight', 'specifico' ), type: 'weight' },
        ] },
        { title: __( 'Typography', 'specifico' ), fields: [
            { key: 'font_size', label: __( 'Font size', 'specifico' ), type: 'unit', placeholder: '14' },
            { key: 'font_weight', label: __( 'Font weight', 'specifico' ), type: 'weight' },
        ] },
    ];

    const wcTabOptions = [
        { value: 'keep', label: __( 'Keep it', 'specifico' ) },
        { value: 'remove', label: __( 'Always remove', 'specifico' ) },
        { value: 'remove_if_specs', label: __( 'Remove when product has specifications', 'specifico' ) }
    ];

    const compareMaxOptions = [
        { value: 2, label: __( '2 products', 'specifico' ) },
        { value: 3, label: __( '3 products', 'specifico' ) },
        { value: 4, label: __( '4 products', 'specifico' ) }
    ];

    const compareBtnStyleOptions = [
        { value: 'theme', label: __( 'Match theme', 'specifico' ) },
        { value: 'solid', label: __( 'Solid', 'specifico' ) },
        { value: 'outline', label: __( 'Outline', 'specifico' ) },
        { value: 'pill', label: __( 'Pill', 'specifico' ) },
        { value: 'custom', label: __( 'Custom', 'specifico' ) }
    ];

    // Custom compare-button fields.
    const compareBtnStyleGroups = [
        { title: __( 'Spacing & radius', 'specifico' ), fields: [
            { key: 'padding', label: __( 'Padding', 'specifico' ), type: 'padding' },
            { key: 'radius', label: __( 'Border radius', 'specifico' ), type: 'unit', placeholder: '8' },
        ] },
        { title: __( 'Colors', 'specifico' ), fields: [
            { key: 'text_color', label: __( 'Text color', 'specifico' ), type: 'color' },
            { key: 'bg', label: __( 'Background', 'specifico' ), type: 'color' },
            { key: 'border_color', label: __( 'Border color', 'specifico' ), type: 'color' },
        ] },
        { title: __( 'Hover', 'specifico' ), fields: [
            { key: 'hover_bg', label: __( 'Hover background', 'specifico' ), type: 'color' },
            { key: 'hover_text', label: __( 'Hover text', 'specifico' ), type: 'color' },
        ] },
        { title: __( 'Typography', 'specifico' ), fields: [
            { key: 'font_size', label: __( 'Font size', 'specifico' ), type: 'unit', placeholder: '14' },
            { key: 'font_weight', label: __( 'Font weight', 'specifico' ), type: 'weight' },
        ] },
    ];

    const compareTableStyleOptions = [
        { value: 'default', label: __( 'Default', 'specifico' ) },
        { value: 'custom', label: __( 'Custom', 'specifico' ) }
    ];

    // Custom comparison-table fields.
    const compareTableStyleGroups = [
        { title: __( 'Spacing', 'specifico' ), fields: [
            { key: 'cell_padding', label: __( 'Cell padding', 'specifico' ), type: 'padding' },
        ] },
        { title: __( 'Colors', 'specifico' ), fields: [
            { key: 'text_color', label: __( 'Text color', 'specifico' ), type: 'color' },
            { key: 'border_color', label: __( 'Border color', 'specifico' ), type: 'color' },
            { key: 'value_bg', label: __( 'Cell background', 'specifico' ), type: 'color' },
        ] },
        { title: __( 'Header row', 'specifico' ), fields: [
            { key: 'header_bg', label: __( 'Header background', 'specifico' ), type: 'color' },
            { key: 'header_color', label: __( 'Header text', 'specifico' ), type: 'color' },
            { key: 'header_weight', label: __( 'Header weight', 'specifico' ), type: 'weight' },
        ] },
        { title: __( 'Rows', 'specifico' ), fields: [
            { key: 'label_bg', label: __( 'Row label background', 'specifico' ), type: 'color' },
            { key: 'diff_bg', label: __( 'Difference highlight', 'specifico' ), type: 'color' },
        ] },
        { title: __( 'Typography', 'specifico' ), fields: [
            { key: 'font_size', label: __( 'Font size', 'specifico' ), type: 'unit', placeholder: '14' },
            { key: 'font_weight', label: __( 'Font weight', 'specifico' ), type: 'weight' },
        ] },
    ];

    // Friendly font-weight choices (blank = inherit the theme).
    const weightOptions = [
        { value: '', label: __( 'Default', 'specifico' ) },
        { value: '400', label: __( 'Normal (400)', 'specifico' ) },
        { value: '500', label: __( 'Medium (500)', 'specifico' ) },
        { value: '600', label: __( 'Semibold (600)', 'specifico' ) },
        { value: '700', label: __( 'Bold (700)', 'specifico' ) },
        { value: '800', label: __( 'Extra bold (800)', 'specifico' ) },
    ];

    const setStyleField = ( key, val ) => setCustomStyles( ( prev ) => ( { ...prev, [ key ]: val } ) );
    const setBtnStyleField = ( key, val ) => setCompareBtnStyles( ( prev ) => ( { ...prev, [ key ]: val } ) );
    const setBtnArchiveStyleField = ( key, val ) => setCompareBtnStylesArchive( ( prev ) => ( { ...prev, [ key ]: val } ) );
    const setCompareTableStyleField = ( key, val ) => setCompareTableStyles( ( prev ) => ( { ...prev, [ key ]: val } ) );

    // Appearance panel registry. Each entry ties the settings state for one
    // surface to its field groups, updater, reset and preview type.
    const PANELS = {
        specTable:        { title: __( 'Spec table appearance', 'specifico' ), preview: 'spec', groups: customStyleGroups, values: customStyles, setField: setStyleField, reset: () => setCustomStyles( {} ) },
        compareBtn:       { title: __( 'Compare button appearance (single page)', 'specifico' ), preview: 'button', groups: compareBtnStyleGroups, values: compareBtnStyles, setField: setBtnStyleField, reset: () => setCompareBtnStyles( {} ) },
        compareBtnArchive: { title: __( 'Compare button appearance (shop / archive card)', 'specifico' ), preview: 'button', groups: compareBtnStyleGroups, values: compareBtnStylesArchive, setField: setBtnArchiveStyleField, reset: () => setCompareBtnStylesArchive( {} ) },
        compareTable:     { title: __( 'Comparison table appearance', 'specifico' ), preview: 'table', groups: compareTableStyleGroups, values: compareTableStyles, setField: setCompareTableStyleField, reset: () => setCompareTableStyles( {} ) },
    };

    // What a blank ("inherit") field resolves to in the live preview — matches
    // the CSS fallbacks the frontend uses when a variable is unset.
    const DEF = {
        specTable:    { cell_padding: '8px', radius: '0', text_color: '#23232E', cell_bg: '#ffffff', stripe_bg: '#f6f6fb', border_color: '#e5e7eb', header_bg: '#f6f6fb', header_color: '#23232E', header_weight: '700', font_size: '14px', font_weight: '400' },
        compareBtn:        { padding: '0.65em 1.3em', radius: '8px', text_color: '#ffffff', bg: '#6B66F7', border_color: '#6B66F7', hover_bg: '#5a55e8', hover_text: '#ffffff', font_size: '14px', font_weight: '600' },
        compareBtnArchive: { padding: '0.65em 1.3em', radius: '8px', text_color: '#ffffff', bg: '#6B66F7', border_color: '#6B66F7', hover_bg: '#5a55e8', hover_text: '#ffffff', font_size: '14px', font_weight: '600' },
        compareTable: { cell_padding: '10px 12px', text_color: '#23232E', border_color: '#e5e7eb', value_bg: '#ffffff', label_bg: '#f9fafb', header_bg: '#f3f4f6', header_color: '#23232E', header_weight: '600', diff_bg: '#fffbeb', font_size: '14px', font_weight: '400' },
    };

    // Preview resolver: override if set, else the neutral default.
    const valFor = ( panelKey, key ) => {
        const ov = PANELS[ panelKey ].values[ key ];
        return ( ov !== undefined && String( ov ).trim() !== '' ) ? ov : DEF[ panelKey ][ key ];
    };

    // How many fields the merchant has actually overridden (drives the badge).
    const panelCount = ( panelKey ) => Object.keys( DEF[ panelKey ] ).reduce(
        ( n, k ) => n + ( String( PANELS[ panelKey ].values[ k ] || '' ).trim() ? 1 : 0 ),
        0
    );

    const handleSubmit = ( e ) => {
        e.preventDefault();

        setLoader( __( 'Updating...', 'specifico' ) );
        setBtnClass( 'saving' );

        Api.post( '/specifico/v1/settings', {
            enable_sub_heading: enableSubHeading,
            styles: styles,
            custom_styles: customStyles,
            tab_title: tabTitle,
            wc_additional_info: wcAdditionalInfo,
            enable_comparison: enableComparison,
            compare_on_single: compareOnSingle,
            compare_on_archive: compareOnArchive,
            compare_max: compareMax,
            compare_highlight: compareHighlight,
            compare_btn_style: compareBtnStyle,
            compare_btn_styles: compareBtnStyles,
            compare_btn_style_archive: compareBtnStyleArchive,
            compare_btn_styles_archive: compareBtnStylesArchive,
            compare_table_style: compareTableStyle,
            compare_table_styles: compareTableStyles,
            compare_page: comparePage,
        }).then( ( res ) => {
            setLoader( __( 'Save Settings', 'specifico' ) );
            setBtnClass( '' );
        } );
    }

    useEffect( () => {
        fetchData();
        fetchPages();
    }, []);

    // Warn when the chosen comparison page is missing the [specifico_compare]
    // shortcode — otherwise the tray's "Compare" button navigates to an empty
    // page. Reads raw content (context=edit), so the rendered/expanded shortcode
    // doesn't hide the literal we're looking for.
    useEffect( () => {
        if ( ! comparePage ) {
            setPageShortcode( 'unknown' );
            return;
        }
        setPageShortcode( 'checking' );
        Api.get( `/wp/v2/pages/${ comparePage }?context=edit&_fields=content` )
            .then( ( res ) => {
                const raw = res?.data?.content?.raw;
                if ( typeof raw !== 'string' ) {
                    // Couldn't read the source (permissions/other) — don't false-alarm.
                    setPageShortcode( 'unknown' );
                    return;
                }
                setPageShortcode( raw.indexOf( '[specifico_compare' ) !== -1 ? 'present' : 'missing' );
            } )
            .catch( () => setPageShortcode( 'unknown' ) );
    }, [ comparePage ] );

    const fetchData = async () => {
        try {
            Api.get( '/specifico/v1/settings' ). then( ( res ) => {
                setIsLoading( true );

                setEnableSubHeading( res.data.enable_sub_heading )
                setStyles( res.data.styles );
                setCustomStyles( res.data.custom_styles || {} );
                setTabTitle( res.data.tab_title || '' );
                setWcAdditionalInfo( res.data.wc_additional_info || 'keep' );

                // Comparison — off unless a merchant has explicitly enabled it.
                setEnableComparison( res.data.enable_comparison === true );
                setCompareOnSingle( res.data.compare_on_single !== false );
                setCompareOnArchive( res.data.compare_on_archive !== false );
                setCompareMax( res.data.compare_max ? parseInt( res.data.compare_max, 10 ) : 4 );
                setCompareHighlight( res.data.compare_highlight !== false );
                setCompareBtnStyle( res.data.compare_btn_style || 'theme' );
                setCompareBtnStyles( res.data.compare_btn_styles || {} );
                setCompareBtnStyleArchive( res.data.compare_btn_style_archive || 'theme' );
                setCompareBtnStylesArchive( res.data.compare_btn_styles_archive || {} );
                setCompareTableStyle( res.data.compare_table_style || 'default' );
                setCompareTableStyles( res.data.compare_table_styles || {} );
                setComparePage( res.data.compare_page ? parseInt( res.data.compare_page, 10 ) : 0 );
            }).then( ( res ) => {
                setIsLoading( false );
            } );
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    }

    const fetchPages = async () => {
        try {
            Api.get( '/wp/v2/pages?per_page=100&status=publish&_fields=id,title' ).then( ( res ) => {
                const pages = ( res.data || [] ).map( ( p ) => ( {
                    value: p.id,
                    label: ( p.title && p.title.rendered ) ? p.title.rendered : `#${p.id}`,
                } ) );
                setPageOptions( [ { value: 0, label: __( 'None (use slide-in drawer)', 'specifico' ) }, ...pages ] );
            } );
        } catch ( error ) {
            console.error( 'Error fetching pages:', error );
        }
    }

    // Section card with a lavender icon badge header, per the redesign handoff.
    const Section = ( { icon, title, desc, children } ) => (
        <div className={`${CARD} overflow-hidden`}>
            <div className="flex items-center gap-[13px] px-6 py-[18px] border-b border-[#EFEFF4]">
                <span className="w-[38px] h-[38px] flex-none rounded-[11px] bg-[#F2F1FF] flex items-center justify-center">{icon}</span>
                <div>
                    <div className="font-extrabold text-[15.5px] text-[#23232E] tracking-[-0.2px]">{title}</div>
                    <div className="font-medium text-[12.5px] text-[#9A9AAE] mt-0.5">{desc}</div>
                </div>
            </div>
            {children}
        </div>
    );

    const Row = ( { title, desc, children, last, top } ) => (
        <div className={ "grid grid-cols-[300px_minmax(0,1fr)] gap-6 px-6 py-[18px] " + ( top ? "items-start" : "items-center" ) + ( last ? "" : " border-b border-[#F3F3F8]" ) }>
            <div className="max-w-[460px]">
                <div className="font-bold text-[13.5px] text-[#23232E]">{title}</div>
                <div className="font-medium text-[12.5px] leading-[1.5] text-[#9A9AAE] mt-[3px]">{desc}</div>
            </div>
            <div className="flex justify-start">{children}</div>
        </div>
    );

    // A style select plus, when set to "Custom", a "Customize appearance" button
    // with a badge that opens the appearance modal.
    const StyleControl = ( { id, value, onChange, items, panelKey, isCustom } ) => {
        const n = isCustom ? panelCount( panelKey ) : 0;
        return (
            <div className="flex flex-col gap-[11px] w-full">
                <Select bare id={ id } className="!max-w-[420px]" value={ value } onChange={ onChange } items={ items } />
                { isCustom && (
                    <button
                        type="button"
                        onClick={ () => setDrawer( panelKey ) }
                        className="inline-flex items-center justify-between gap-3 self-start h-9 pl-[13px] pr-[9px] bg-[#F6F5FF] border border-[#E2DFFF] rounded-[10px] cursor-pointer hover:bg-[#EEEBFF] transition-colors"
                    >
                        <span className="inline-flex items-center gap-[7px] font-bold text-[12.5px] text-[#6B66F7]">
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M4 12l7-7a1.5 1.5 0 0 0-2-2l-7 7v2h2z" stroke="#6B66F7" strokeWidth="1.3" strokeLinejoin="round"/></svg>
                            { __( 'Customize appearance', 'specifico' ) }
                        </span>
                        <span className={ ( n > 0 ? "bg-[#6B66F7] text-white" : "bg-[#EDEBFF] text-[#6B66F7]" ) + " px-2 py-[2px] rounded-[7px] font-extrabold text-[10.5px]" }>
                            {
                                n > 0
                                    /* translators: %d: number of overridden custom style fields. */
                                    ? sprintf( __( '%d custom', 'specifico' ), n )
                                    : __( 'Inherits theme', 'specifico' )
                            }
                        </span>
                    </button>
                ) }
            </div>
        );
    };

    const tableIcon = (
        <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="4" width="14" height="12" rx="2" stroke="#6B66F7" strokeWidth="1.7" />
            <line x1="3" y1="8.5" x2="17" y2="8.5" stroke="#6B66F7" strokeWidth="1.5" />
            <line x1="9" y1="8.5" x2="9" y2="16" stroke="#B7B4FF" strokeWidth="1.5" />
        </svg>
    );

    const compareIcon = (
        <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="4" width="6" height="12" rx="1.6" stroke="#6B66F7" strokeWidth="1.7" />
            <rect x="11" y="4" width="6" height="12" rx="1.6" stroke="#B7B4FF" strokeWidth="1.7" />
        </svg>
    );

    // ---- Live storefront preview inside the appearance modal ----
    const renderPreview = ( panelKey ) => {
        const v = ( key ) => valFor( panelKey, key );
        const kind = PANELS[ panelKey ].preview;

        if ( kind === 'spec' ) {
            const head = { padding: v( 'cell_padding' ), background: v( 'header_bg' ), color: v( 'header_color' ), fontWeight: v( 'header_weight' ), fontSize: '11px', letterSpacing: '.03em' };
            const rows = [ [ 'Fabric', '100% Cotton' ], [ 'Weight', '180 gsm' ], [ 'Fit', 'Regular' ] ];
            return (
                <div style={ { border: `1px solid ${v( 'border_color' )}`, borderRadius: v( 'radius' ), overflow: 'hidden', fontSize: v( 'font_size' ), fontWeight: v( 'font_weight' ), color: v( 'text_color' ) } }>
                    <div style={ { display: 'grid', gridTemplateColumns: '1fr 1.5fr' } }><div style={ head }>{ __( 'SPEC', 'specifico' ) }</div><div style={ head }>{ __( 'VALUE', 'specifico' ) }</div></div>
                    { rows.map( ( r, i ) => {
                        const cell = { padding: v( 'cell_padding' ), background: i % 2 ? v( 'stripe_bg' ) : v( 'cell_bg' ), borderTop: `1px solid ${v( 'border_color' )}`, color: v( 'text_color' ) };
                        return <div key={ i } style={ { display: 'grid', gridTemplateColumns: '1fr 1.5fr' } }><div style={ cell }>{ r[0] }</div><div style={ cell }>{ r[1] }</div></div>;
                    } ) }
                </div>
            );
        }

        if ( kind === 'button' ) {
            const base = { padding: v( 'padding' ), borderRadius: v( 'radius' ), border: `1px solid ${v( 'border_color' )}`, fontFamily: 'Nunito,sans-serif', fontSize: v( 'font_size' ), fontWeight: v( 'font_weight' ), cursor: 'pointer' };
            return (
                <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-4 py-[14px]">
                    <div className="flex flex-col items-center gap-2 max-w-full min-w-0"><button style={ { ...base, maxWidth: '100%', background: v( 'bg' ), color: v( 'text_color' ) } }>{ __( 'Compare', 'specifico' ) }</button><span className="font-extrabold text-[9.5px] tracking-[0.08em] text-[#A2A2B4]">{ __( 'DEFAULT', 'specifico' ) }</span></div>
                    <div className="flex flex-col items-center gap-2 max-w-full min-w-0"><button style={ { ...base, maxWidth: '100%', background: v( 'hover_bg' ), color: v( 'hover_text' ) } }>{ __( 'Compare', 'specifico' ) }</button><span className="font-extrabold text-[9.5px] tracking-[0.08em] text-[#A2A2B4]">{ __( 'HOVER', 'specifico' ) }</span></div>
                </div>
            );
        }

        // comparison table
        const cp = v( 'cell_padding' ), bc = v( 'border_color' );
        const head = { padding: cp, background: v( 'header_bg' ), color: v( 'header_color' ), fontWeight: v( 'header_weight' ), fontSize: '11px' };
        const rows = [ [ 'Weight', '1.2 kg', '1.4 kg', true ], [ 'Screen', '13 in', '13 in', false ], [ 'RAM', '16 GB', '8 GB', true ] ];
        return (
            <div style={ { border: `1px solid ${bc}`, borderRadius: '8px', overflow: 'hidden', fontFamily: 'Nunito,sans-serif', fontSize: v( 'font_size' ), fontWeight: v( 'font_weight' ), color: v( 'text_color' ) } }>
                <div style={ { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' } }><div style={ head }>{ __( 'FEATURE', 'specifico' ) }</div><div style={ head }>{ __( 'LAPTOP A', 'specifico' ) }</div><div style={ head }>{ __( 'LAPTOP B', 'specifico' ) }</div></div>
                { rows.map( ( r, i ) => {
                    const diff = r[3];
                    const label = { padding: cp, background: diff ? v( 'diff_bg' ) : v( 'label_bg' ), borderTop: `1px solid ${bc}`, fontWeight: 700 };
                    const cell = { padding: cp, background: diff ? v( 'diff_bg' ) : v( 'value_bg' ), borderTop: `1px solid ${bc}` };
                    return <div key={ i } style={ { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' } }><div style={ label }>{ r[0] }</div><div style={ cell }>{ r[1] }</div><div style={ cell }>{ r[2] }</div></div>;
                } ) }
            </div>
        );
    };

    // ---- Appearance modal ----
    const renderDrawer = () => {
        if ( ! drawer ) return null;
        const panel = PANELS[ drawer ];
        const previewNote = panel.preview === 'spec' ? __( 'spec table', 'specifico' ) : ( panel.preview === 'button' ? __( 'compare button', 'specifico' ) : __( 'comparison table', 'specifico' ) );

        // One appearance control. `type` picks a friendly widget over raw CSS:
        // color = swatch + hex, weight = named dropdown, unit = number + px suffix,
        // padding = separate vertical/horizontal numbers. Blank = inherit.
        const renderField = ( field ) => {
            const raw     = panel.values[ field.key ] ?? '';
            const hasVal  = String( raw ).trim() !== '';
            const defV    = DEF[ drawer ][ field.key ] || '';
            const resetCls = hasVal
                ? "flex-none w-[34px] h-[34px] rounded-[9px] inline-flex items-center justify-center cursor-pointer border border-[#E2DFFF] bg-[#F6F5FF] text-[#6B66F7]"
                : "flex-none w-[34px] h-[34px] rounded-[9px] inline-flex items-center justify-center border border-[#EFEFF4] bg-white text-[#D3D3DE] cursor-default";
            const resetBtn = (
                <button type="button" title={ __( 'Reset to inherit', 'specifico' ) } onClick={ () => hasVal && panel.setField( field.key, '' ) } className={ resetCls }>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M13 8a5 5 0 1 1-1.4-3.5M13 3v3h-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
            );
            const labelEl = <div className="font-bold text-[12px] text-[#3A3A45] mb-[7px]">{ field.label }</div>;
            const numBoxCls = "flex-1 min-w-0 flex items-center border border-[#E7E7EF] rounded-[9px] bg-white focus-within:border-[#6B66F7] focus-within:shadow-[0_0_0_3px_rgba(107,102,247,0.16)]";
            // The wrapper (numBoxCls) owns the border + focus ring, so the input
            // must suppress WP-admin's default focus border/box-shadow to avoid a
            // second ring inside the box.
            const numInputCls = "w-full h-[36px] px-[11px] !border-0 bg-transparent !shadow-none !outline-none focus:!border-0 focus:!shadow-none focus:!outline-none focus:!ring-0 font-medium text-[13px] text-[#23232E] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
            const pxSuffix = <span className="px-2 text-[12px] text-[#9A9AAE] font-semibold select-none">px</span>;

            if ( field.type === 'color' ) {
                const isHex  = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test( raw );
                const swatch = isHex ? raw : ( /^#/.test( defV ) ? defV : '#c9c9d6' );
                return (
                    <div key={ field.key }>
                        { labelEl }
                        <div className="flex items-center gap-2">
                            <input type="color" aria-label={ sprintf( /* translators: %s: field label. */ __( '%s color picker', 'specifico' ), field.label ) } value={ swatch } onChange={ ( e ) => panel.setField( field.key, e.target.value ) } className="flex-none w-[38px] h-[38px] p-[2px] border border-[#E7E7EF] rounded-[9px] bg-white cursor-pointer" />
                            <input type="text" value={ raw } placeholder={ __( 'Inherit', 'specifico' ) } onChange={ ( e ) => panel.setField( field.key, e.target.value ) } className="flex-1 min-w-0 h-[38px] border border-[#E7E7EF] rounded-[9px] px-[11px] font-medium text-[12.5px] text-[#23232E] outline-none bg-white font-mono focus:border-[#6B66F7] focus:shadow-[0_0_0_3px_rgba(107,102,247,0.16)]" />
                            { resetBtn }
                        </div>
                    </div>
                );
            }

            if ( field.type === 'weight' ) {
                return (
                    <div key={ field.key }>
                        { labelEl }
                        <Select
                            bare
                            id={ `${ drawer }-${ field.key }` }
                            value={ raw }
                            onChange={ ( e ) => panel.setField( field.key, e.target.value ) }
                            items={ weightOptions }
                        />
                    </div>
                );
            }

            if ( field.type === 'padding' ) {
                const pad = parsePadding( raw );
                const sub = ( val, onChange, caption ) => (
                    <div>
                        <div className={ numBoxCls }>
                            <input type="number" min="0" value={ val } placeholder="0" onChange={ onChange } className={ numInputCls } />
                            { pxSuffix }
                        </div>
                        <div className="text-[10.5px] text-[#9A9AAE] mt-1 text-center">{ caption }</div>
                    </div>
                );
                return (
                    <div key={ field.key } className="col-span-2">
                        { labelEl }
                        <div className="flex items-start gap-2">
                            <div className="flex-1 grid grid-cols-2 gap-2">
                                { sub( pad.v, ( e ) => panel.setField( field.key, composePadding( e.target.value, pad.h ) ), __( 'Vertical', 'specifico' ) ) }
                                { sub( pad.h, ( e ) => panel.setField( field.key, composePadding( pad.v, e.target.value ) ), __( 'Horizontal', 'specifico' ) ) }
                            </div>
                            { resetBtn }
                        </div>
                    </div>
                );
            }

            // 'unit' — a single number with an implied px suffix.
            return (
                <div key={ field.key }>
                    { labelEl }
                    <div className="flex items-center gap-2">
                        <div className={ numBoxCls }>
                            <input type="number" min="0" value={ parseNum( raw ) } placeholder={ field.placeholder || '0' } onChange={ ( e ) => panel.setField( field.key, composeUnit( e.target.value ) ) } className={ numInputCls } />
                            { pxSuffix }
                        </div>
                        { resetBtn }
                    </div>
                </div>
            );
        };

        return (
            <div onClick={ () => setDrawer( null ) } className="fixed inset-0 z-[100000] bg-[rgba(28,26,58,0.44)] flex items-center justify-center p-7">
                <div onClick={ ( e ) => e.stopPropagation() } className="w-[min(920px,96vw)] max-h-[88vh] flex flex-col bg-white rounded-[20px] overflow-hidden shadow-[0_42px_100px_-34px_rgba(30,28,80,0.6)]">
                    {/* header */}
                    <div className="flex items-start justify-between gap-[14px] px-6 pt-5 pb-[18px] border-b border-[#EFEFF4]">
                        <div>
                            <div className="font-extrabold text-[17px] text-[#23232E] tracking-[-0.2px]">{ panel.title }</div>
                            <div className="font-medium text-[12.5px] leading-[1.5] text-[#9A9AAE] mt-[3px]">{ __( 'Leave a field blank to inherit your theme — only what you fill in overrides it.', 'specifico' ) }</div>
                        </div>
                        <button type="button" onClick={ () => setDrawer( null ) } className="flex-none w-[34px] h-[34px] rounded-[9px] border border-[#EFEFF4] bg-white cursor-pointer inline-flex items-center justify-center hover:bg-[#F5F5F9]">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="#54546A" strokeWidth="1.6" strokeLinecap="round"/></svg>
                        </button>
                    </div>

                    {/* body: preview | controls */}
                    <div className="flex-1 min-h-0 grid grid-cols-[340px_minmax(0,1fr)]">
                        <div className="bg-[#F6F5FF] border-r border-[#EEECFF] px-5 py-[22px] flex flex-col gap-[14px] overflow-auto">
                            <div className="font-bold text-[10px] tracking-[0.11em] uppercase text-[#8F8BC8]">{ __( 'Storefront preview', 'specifico' ) }</div>
                            <div className="bg-white border border-[#EAE8FB] rounded-[14px] p-4 shadow-[0_12px_34px_-20px_rgba(50,45,120,0.45)]">
                                { renderPreview( drawer ) }
                            </div>
                            <div className="font-medium text-[11.5px] leading-[1.55] text-[#9A9AAE]">
                                {
                                    /* translators: %s: the previewed element (spec table, compare button or comparison table). */
                                    sprintf( __( 'Updates live as you edit. This is roughly how the %s will appear on your store.', 'specifico' ), previewNote )
                                }
                            </div>
                        </div>

                        <div className="overflow-auto px-[22px] pt-5 pb-2">
                            { panel.groups.map( ( group ) => (
                                <div key={ group.title } className="mb-[18px]">
                                    <div className="font-bold text-[10.5px] tracking-[0.09em] uppercase text-[#A2A2B4] mb-3">{ group.title }</div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-[14px]">
                                        { group.fields.map( renderField ) }
                                    </div>
                                </div>
                            ) ) }
                        </div>
                    </div>

                    {/* footer */}
                    <div className="flex items-center justify-between gap-3 px-6 py-[14px] border-t border-[#EFEFF4] bg-white">
                        <button type="button" onClick={ panel.reset } className="h-[38px] px-[14px] bg-white border border-[#E7E7EF] rounded-[10px] font-bold text-[12.5px] text-[#54546A] cursor-pointer hover:bg-[#F5F5F9]">{ __( 'Reset all fields', 'specifico' ) }</button>
                        <button type="button" onClick={ () => setDrawer( null ) } className="h-[38px] px-5 bg-[#6B66F7] text-white border-none rounded-[10px] font-bold text-[13px] cursor-pointer shadow-[0_5px_14px_-4px_rgba(107,102,247,0.55)] hover:bg-[#5a55e8]">{ __( 'Done', 'specifico' ) }</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="font-['Nunito'] text-sm mt-5 mr-5 relative text-[#54546A]">
            {/* page header card */}
            <div className={`${CARD} flex items-center justify-between gap-4 px-6 py-[18px] mb-5`}>
                <div className="flex items-center gap-[15px]">
                    <span className="w-10 [&_svg]:w-10 [&_svg]:h-auto block"><Logo /></span>
                    <div>
                        <div className="font-extrabold text-[19px] text-[#23232E] tracking-[-0.2px]">{ __( 'Specification Settings', 'specifico' ) }</div>
                        <div className="font-medium text-[13px] text-[#9A9AAE] mt-0.5">{ __( 'Manage global settings for product specifications.', 'specifico' ) }</div>
                    </div>
                </div>
                <div className="flex-none">
                    <button type="button" onClick={ (e) => handleSubmit( e ) } disabled={ !!btnClass } className={ "whitespace-nowrap inline-flex items-center gap-[7px] h-[38px] px-[18px] bg-[#6B66F7] text-white border-none rounded-[11px] font-bold text-[13.5px] cursor-pointer shadow-[0_5px_14px_-4px_rgba(107,102,247,0.55)] hover:bg-[#5a55e8] transition-colors disabled:opacity-60 " + btnClass }>
                        {loader}
                    </button>
                </div>
            </div>

            { ! isLoading ?
                <Form onSubmit={ (e) => { handleSubmit( e ) } } className="flex flex-col gap-5">
                    <Section icon={tableIcon} title={ __( 'Specification tables', 'specifico' ) } desc={ __( 'How spec tables render on the storefront.', 'specifico' ) }>
                        <Row title={ __( 'Enable group heading', 'specifico' ) } desc={ __( 'Show group titles as section headers in the spec table.', 'specifico' ) }>
                            <Switch bare id="_specifico_settings[enable_sub_heading]" name="_specifico_settings[enable_sub_heading]" checked={enableSubHeading} onChange={ () => setEnableSubHeading((prev) => !prev) } />
                        </Row>
                        <Row title={ __( 'Table style', 'specifico' ) } desc={ __( 'Preset looks for the rendered table. Choose “Custom” to style it yourself.', 'specifico' ) } top={ styles?.value === 'custom' }>
                            <StyleControl
                                id="_specifico_settings[default_styles]"
                                value={ styles?.value || '' }
                                onChange={ (e) => { const opt = styleOptions.find( ( o ) => o.value === e.target.value ); setStyles( opt || { value: e.target.value, label: e.target.value } ); } }
                                items={ styleOptions }
                                panelKey="specTable"
                                isCustom={ styles?.value === 'custom' }
                            />
                        </Row>
                        <Row title={ __( 'Specifications tab title', 'specifico' ) } desc={ __( 'Heading for the specifications product tab.', 'specifico' ) }>
                            <input id="_specifico_settings[tab_title]" type="text" value={tabTitle} onChange={ (e) => setTabTitle( e.target.value )} placeholder={ __( 'Specifications', 'specifico' ) } className={ FIELD } />
                        </Row>
                        <Row title={ __( 'Additional Information tab', 'specifico' ) } desc={ __( 'Control WooCommerce’s default info tab.', 'specifico' ) } last>
                            <Select bare id="_specifico_settings[wc_additional_info]" className="!max-w-[420px]" value={wcAdditionalInfo} onChange={ (e) => setWcAdditionalInfo( e.target.value )} items={wcTabOptions} />
                        </Row>
                    </Section>

                    <Section icon={compareIcon} title={ __( 'Product comparison', 'specifico' ) } desc={ __( 'Let shoppers line products up side by side.', 'specifico' ) }>
                        <Row title={ __( 'Enable comparison', 'specifico' ) } desc={ __( 'Let shoppers add products to a compare tray and view specs side by side.', 'specifico' ) } last={ ! enableComparison }>
                            <Switch bare id="_specifico_settings[enable_comparison]" checked={enableComparison} onChange={ () => setEnableComparison((prev) => !prev) } />
                        </Row>
                        { enableComparison && ( <>
                        <Row title={ __( 'Compare button on product page', 'specifico' ) } desc={ __( 'Show the “Compare” button on single product pages.', 'specifico' ) }>
                            <Switch bare id="_specifico_settings[compare_on_single]" checked={compareOnSingle} onChange={ () => setCompareOnSingle((prev) => !prev) } />
                        </Row>
                        <Row title={ __( 'Compare button on shop / archive', 'specifico' ) } desc={ __( 'Show the “Compare” button on shop and category product cards.', 'specifico' ) }>
                            <Switch bare id="_specifico_settings[compare_on_archive]" checked={compareOnArchive} onChange={ () => setCompareOnArchive((prev) => !prev) } />
                        </Row>
                        <Row title={ __( 'Maximum products to compare', 'specifico' ) } desc={ __( 'How many products a shopper can compare at once.', 'specifico' ) }>
                            <Select bare id="_specifico_settings[compare_max]" className="!max-w-[420px]" value={compareMax} onChange={ (e) => setCompareMax( parseInt( e.target.value, 10 ) )} items={compareMaxOptions} />
                        </Row>
                        <Row title={ __( 'Compare button style — single page', 'specifico' ) } desc={ __( '“Match theme” inherits your theme’s button look. Solid, Outline and Pill use Specifico’s own style. Choose “Custom” to set your own.', 'specifico' ) } top={ compareBtnStyle === 'custom' }>
                            <StyleControl
                                id="_specifico_settings[compare_btn_style]"
                                value={ compareBtnStyle }
                                onChange={ (e) => setCompareBtnStyle( e.target.value ) }
                                items={ compareBtnStyleOptions }
                                panelKey="compareBtn"
                                isCustom={ compareBtnStyle === 'custom' }
                            />
                        </Row>
                        <Row title={ __( 'Compare button style — shop / archive card', 'specifico' ) } desc={ __( 'Style the compare button that sits inside product cards on shop and category pages, independently of the single-page one.', 'specifico' ) } top={ compareBtnStyleArchive === 'custom' }>
                            <StyleControl
                                id="_specifico_settings[compare_btn_style_archive]"
                                value={ compareBtnStyleArchive }
                                onChange={ (e) => setCompareBtnStyleArchive( e.target.value ) }
                                items={ compareBtnStyleOptions }
                                panelKey="compareBtnArchive"
                                isCustom={ compareBtnStyleArchive === 'custom' }
                            />
                        </Row>
                        <Row title={ __( 'Highlight differences', 'specifico' ) } desc={ __( 'Emphasize rows where the compared products have different values.', 'specifico' ) }>
                            <Switch bare id="_specifico_settings[compare_highlight]" checked={compareHighlight} onChange={ () => setCompareHighlight((prev) => !prev) } />
                        </Row>
                        <Row title={ __( 'Comparison table style', 'specifico' ) } desc={ __( '“Default” uses Specifico’s built-in look. Choose “Custom” to style the side-by-side table yourself.', 'specifico' ) } top={ compareTableStyle === 'custom' }>
                            <StyleControl
                                id="_specifico_settings[compare_table_style]"
                                value={ compareTableStyle }
                                onChange={ (e) => setCompareTableStyle( e.target.value ) }
                                items={ compareTableStyleOptions }
                                panelKey="compareTable"
                                isCustom={ compareTableStyle === 'custom' }
                            />
                        </Row>
                        <Row title={ __( 'Comparison page', 'specifico' ) } desc={ __( 'Page holding the [specifico_compare] shortcode. Leave as “None” to use the slide-in drawer.', 'specifico' ) } last top={ !! comparePage && pageShortcode === 'missing' }>
                            <div className="w-full flex flex-col gap-2.5">
                                <Select bare id="_specifico_settings[compare_page]" className="!max-w-[420px]" value={comparePage} onChange={ (e) => setComparePage( parseInt( e.target.value, 10 ) )} items={pageOptions} />
                                { !! comparePage && pageShortcode === 'missing' && (
                                    <div className="flex items-start gap-2 max-w-[420px] px-3 py-2.5 bg-[#FFFBEB] border border-[#FCE8A6] rounded-[10px]">
                                        <svg width="15" height="15" viewBox="0 0 20 20" fill="none" className="flex-none mt-px">
                                            <path d="M10 7.2v3.6M10 14h.01M8.6 3.3 1.9 15a1.6 1.6 0 0 0 1.4 2.4h13.4a1.6 1.6 0 0 0 1.4-2.4L11.4 3.3a1.6 1.6 0 0 0-2.8 0Z" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <div className="font-medium text-[12px] leading-[1.5] text-[#92400E]">
                                            { __( 'This page doesn’t contain the [specifico_compare] shortcode yet. Add it to the page, or the “Compare” button will open an empty page.', 'specifico' ) }
                                        </div>
                                    </div>
                                ) }
                            </div>
                        </Row>
                        </> ) }
                    </Section>
                </Form>
                :
                <div className={`${CARD} overflow-hidden`}>
                    <SettingsLoader />
                </div>
            }

            { renderDrawer() }
        </div>
    );
};

export default Settings;
