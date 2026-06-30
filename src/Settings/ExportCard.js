import React, { useState } from 'react';
import Api from '../Utilites/Api';
import Switch from '../components/Switch';

const CARD = "bg-white border border-[#ECECF3] rounded-2xl shadow-[0_1px_2px_rgba(20,20,45,0.04),0_18px_40px_-24px_rgba(30,28,80,0.18)]";

/**
 * Export card — downloads all Specifico data (tables, groups, mapping, settings
 * and, optionally, per-product specification data) as a portable JSON file.
 */
const ExportCard = ( { loading = false } ) => {
    const [ includeProducts, setIncludeProducts ] = useState( true );
    const [ busy, setBusy ] = useState( false );

    const handleExport = () => {
        setBusy( true );

        Api.get( '/specifico/v1/export', {
            params: { include_products: includeProducts ? 1 : 0 },
        } ).then( ( res ) => {
            const blob = new Blob( [ JSON.stringify( res.data, null, 2 ) ], {
                type: 'application/json',
            } );
            const url = window.URL.createObjectURL( blob );
            const date = new Date().toISOString().slice( 0, 10 );
            const link = document.createElement( 'a' );
            link.href = url;
            link.download = `specifico-export-${ date }.json`;
            document.body.appendChild( link );
            link.click();
            link.remove();
            window.URL.revokeObjectURL( url );
        } ).finally( () => {
            setBusy( false );
        } );
    };

    return (
        <div className={`${CARD} overflow-hidden`}>
            <div className="px-6 py-4 border-b border-[#EFEFF4] font-extrabold text-[15px] text-[#23232E]">Export</div>
            { loading ? (
                <div className="px-6 py-5 flex flex-col gap-4">
                    <div className="h-2 bg-[#ECEBFF] rounded w-3/4"></div>
                    <div className="h-[58px] bg-[#ECEBFF] rounded-xl w-full max-w-[640px]"></div>
                    <div className="h-[38px] bg-[#ECEBFF] rounded-[10px] w-48"></div>
                </div>
            ) : (
                <div className="px-6 py-5 flex flex-col gap-[18px]">
                    <p className="m-0 font-medium text-[13.5px] leading-[1.6] text-[#9A9AAE] max-w-[640px]">
                        Download all your specification tables, groups, mapping rules and settings as a JSON file. Use it as a backup or to move your specifications to another site.
                    </p>
                    <div className="flex items-center justify-between gap-4 max-w-[640px] px-4 py-3.5 bg-[#FAFAFC] border border-[#EFEFF4] rounded-xl">
                        <div>
                            <div className="font-bold text-[13px] text-[#3A3A45]">Include per-product specification data</div>
                            <div className="font-medium text-[12px] text-[#9A9AAE] mt-0.5">Bundles each product’s customized tables.</div>
                        </div>
                        <Switch
                            bare
                            id="specifico_export_include_products"
                            name="specifico_export_include_products"
                            checked={ includeProducts }
                            onChange={ () => setIncludeProducts( ( prev ) => ! prev ) }
                        />
                    </div>
                    <div>
                        <button
                            type="button"
                            onClick={ handleExport }
                            disabled={ busy }
                            className="inline-flex items-center gap-2 h-[38px] px-[18px] bg-[#6B66F7] text-white border-none rounded-[10px] font-bold text-[13.5px] cursor-pointer shadow-[0_5px_14px_-4px_rgba(107,102,247,0.55)] hover:bg-[#5a55e8] transition-colors disabled:opacity-60"
                        >
                            <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M5 7l3 3 3-3M3 13h10" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            <span>{ busy ? 'Preparing…' : 'Download Export File' }</span>
                        </button>
                    </div>
                </div>
            ) }
        </div>
    );
};

export default ExportCard;
