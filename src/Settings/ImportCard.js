import React, { useRef, useState } from 'react';
import Api from '../Utilites/Api';

const CARD = "bg-white border border-[#ECECF3] rounded-2xl shadow-[0_1px_2px_rgba(20,20,45,0.04),0_18px_40px_-24px_rgba(30,28,80,0.18)]";

const FORMAT_LABELS = {
    specifico: 'Specifico export',
    dornaweb: 'Compatible specification export',
    unknown: 'Unrecognised file',
};

// Shown as a contextual notice only when an uploaded file is recognised as the
// export of another known plugin, so users know it will be migrated.
const SOURCE_NOTICES = {
    dornaweb: 'This file looks like an export from the “Product Specifications” plugin. Specifico will import its tables, groups and product specifications.',
};

// Phases shown in the progress UI (settings is an internal one-off, hidden).
const PHASES = [
    [ 'groups', 'Groups' ],
    [ 'tables', 'Specifications' ],
    [ 'mapping', 'Mapping rules' ],
    [ 'products', 'Products' ],
];

const FileIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 2h6l3 3v9H4z" stroke="#6B66F7" strokeWidth="1.4" strokeLinejoin="round"/></svg>
);

const TrashIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
);

/**
 * Import card — uploads a JSON file, detects Specifico vs competitor (dornaweb)
 * format, previews totals, then imports in small batches with a progress bar so
 * large datasets don't hit a PHP timeout.
 */
const ImportCard = ( { loading = false } ) => {
    const [ file, setFile ] = useState( null );
    const [ dragActive, setDragActive ] = useState( false );
    const [ preparing, setPreparing ] = useState( false );
    const [ prepared, setPrepared ] = useState( null );
    const [ importing, setImporting ] = useState( false );
    const [ progress, setProgress ] = useState( null );
    const [ result, setResult ] = useState( null );
    const [ error, setError ] = useState( '' );

    const inputRef = useRef( null );

    const reset = () => {
        setPrepared( null );
        setProgress( null );
        setResult( null );
        setError( '' );
    };

    const errorMessage = ( err ) =>
        err?.response?.data?.message || 'Something went wrong. Please check the file and try again.';

    const handleFiles = ( fileList ) => {
        const selected = fileList?.[ 0 ] || null;
        reset();
        setFile( selected );

        if ( ! selected ) {
            return;
        }

        const formData = new FormData();
        formData.append( 'file', selected );

        setPreparing( true );
        Api.post( '/specifico/v1/import/prepare', formData, {
            headers: { 'content-type': 'multipart/form-data' },
        } )
            .then( ( res ) => setPrepared( res.data ) )
            .catch( ( err ) => setError( errorMessage( err ) ) )
            .finally( () => setPreparing( false ) );
    };

    const clearFile = () => {
        if ( inputRef.current ) {
            inputRef.current.value = '';
        }
        setFile( null );
        reset();
    };

    const handleDrag = ( e ) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive( 'dragenter' === e.type || 'dragover' === e.type );
    };

    const handleDrop = ( e ) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive( false );
        handleFiles( e.dataTransfer.files );
    };

    const handleImport = async () => {
        if ( ! prepared?.session ) {
            return;
        }

        setImporting( true );
        setError( '' );

        // Seed the bars at 0 from the known totals.
        setProgress( {
            groups: { processed: 0, total: prepared.totals.groups },
            tables: { processed: 0, total: prepared.totals.tables },
            mapping: { processed: 0, total: prepared.totals.mapping },
            products: { processed: 0, total: prepared.totals.products },
        } );

        try {
            let res;
            do {
                // eslint-disable-next-line no-await-in-loop
                res = await Api.post( '/specifico/v1/import/step', { session: prepared.session } ).then( ( r ) => r.data );

                if ( res.error ) {
                    setError( res.error );
                    break;
                }
                if ( res.progress ) {
                    setProgress( res.progress );
                }
            } while ( ! res.finished );

            if ( res && res.finished && ! res.error ) {
                setResult( res.summary );
            }
        } catch ( err ) {
            setError( errorMessage( err ) );
        } finally {
            setImporting( false );
        }
    };

    const activePhases = PHASES.filter( ( [ key ] ) => ( progress?.[ key ]?.total || 0 ) > 0 );
    const overall = activePhases.reduce(
        ( acc, [ key ] ) => {
            acc.processed += progress[ key ].processed;
            acc.total += progress[ key ].total;
            return acc;
        },
        { processed: 0, total: 0 }
    );
    const overallPct = overall.total > 0 ? Math.round( ( overall.processed / overall.total ) * 100 ) : 0;

    const detectedUnknown = prepared && 'unknown' === prepared.format;
    const nothingToImport = prepared && ! detectedUnknown
        && 0 === ( prepared.totals.groups + prepared.totals.tables + prepared.totals.products + prepared.totals.mapping );

    // File chip shown once a file is chosen. `removable` swaps the trailing
    // control between a "Remove" button and a background-import spinner.
    const FileChip = ( { spinner } ) => (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#FAFAFC] border border-[#EFEFF4] rounded-xl">
            <div className="flex items-center gap-[11px] min-w-0">
                <span className="w-[34px] h-[34px] rounded-[9px] bg-[#EDEBFF] flex items-center justify-center flex-none"><FileIcon /></span>
                <div className="font-bold text-[13.5px] text-[#23232E] truncate" title={ file?.name }>
                    { file?.name }
                    { prepared?.size_label && <span className="font-semibold text-[12px] text-[#A2A2B4] ml-1">{ prepared.size_label }</span> }
                </div>
            </div>
            { spinner ? (
                <span className="inline-flex items-center gap-[7px] font-bold text-[12px] text-[#6B66F7] flex-none">
                    <span className="w-[14px] h-[14px] rounded-full border-2 border-[#ECEBFF] border-t-[#6B66F7] inline-block animate-spin" />Background import
                </span>
            ) : (
                <button type="button" onClick={ clearFile } className="inline-flex items-center gap-[7px] h-[34px] px-3.5 bg-white border border-[#F4DADA] rounded-[9px] font-bold text-[12.5px] text-[#DC2626] cursor-pointer hover:bg-[#FEF6F6] flex-none transition-colors">
                    <TrashIcon /> Remove
                </button>
            ) }
        </div>
    );

    return (
        <div className={`${CARD} overflow-hidden`}>
            <div className="px-6 py-4 border-b border-[#EFEFF4] font-extrabold text-[15px] text-[#23232E]">Import</div>
            { loading ? (
                <div className="px-6 py-5 flex flex-col gap-4">
                    <div className="h-2 bg-[#ECEBFF] rounded w-3/4"></div>
                    <div className="h-28 bg-[#ECEBFF] rounded-xl w-full"></div>
                </div>
            ) : (
            <div className="px-6 py-5 flex flex-col gap-[18px]">
                <p className="m-0 font-medium text-[13.5px] leading-[1.6] text-[#9A9AAE] max-w-[680px]">
                    Upload a Specifico export, or a compatible specification export from another plugin, to migrate it. The format is detected automatically. Large files import in the background, so they won’t time out.
                </p>

                <input
                    ref={ inputRef }
                    type="file"
                    accept="application/json,.json"
                    onChange={ ( e ) => handleFiles( e.target.files ) }
                    className="hidden"
                />

                {/* idle: dropzone */}
                { ! file && (
                    <div
                        onClick={ () => inputRef.current?.click() }
                        onDragEnter={ handleDrag }
                        onDragOver={ handleDrag }
                        onDragLeave={ handleDrag }
                        onDrop={ handleDrop }
                        role="button"
                        tabIndex={ 0 }
                        onKeyDown={ ( e ) => { if ( 'Enter' === e.key || ' ' === e.key ) { inputRef.current?.click(); } } }
                        className={ 'flex flex-col items-center justify-center text-center px-6 py-[42px] rounded-2xl border-2 border-dashed cursor-pointer transition-colors outline-none ' + ( dragActive ? 'border-[#6B66F7] bg-[#F5F5FE]' : 'border-[#d9d9e8] bg-[#FAFAFC] hover:border-[#6B66F7] hover:bg-[#F5F5FE]' ) }
                    >
                        <div className="w-[52px] h-[52px] rounded-[14px] bg-[#EDEBFF] flex items-center justify-center mb-3.5">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 16V6M8 10l4-4 4 4M5 18h14" stroke="#6B66F7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                        <div className="font-extrabold text-[15px] text-[#23232E]">Drag &amp; drop your file here</div>
                        <div className="font-medium text-[13px] text-[#9A9AAE] mt-[5px]">or <span className="text-[#6B66F7] font-bold">browse</span> to choose a .json file</div>
                    </div>
                ) }

                {/* file selected, still reading */}
                { file && preparing && <FileChip /> }

                { error && (
                    <p className="m-0 text-[#dc2626] font-medium">{ error }</p>
                ) }

                {/* preview */}
                { file && prepared && ! result && ! importing && ! preparing && (
                    <div className="flex flex-col gap-4">
                        <FileChip />
                        <div className="bg-[#F6F5FF] border border-[#E7E4FF] rounded-xl p-[18px]">
                            <div className="font-extrabold text-[14px] text-[#23232E] mb-[11px]">
                                Detected: { FORMAT_LABELS[ prepared.format ] || prepared.format }
                            </div>
                            { SOURCE_NOTICES[ prepared.format ] && (
                                <div className="border-l-[3px] border-[#6B66F7] bg-white rounded-r-lg px-3.5 py-[11px] font-medium text-[13px] leading-[1.55] text-[#54546A]">
                                    { SOURCE_NOTICES[ prepared.format ] }
                                </div>
                            ) }
                            { nothingToImport ? (
                                <p className="m-0 mt-2 text-[#b45309] font-semibold">This file contains no specifications to import.</p>
                            ) : detectedUnknown ? (
                                <p className="m-0 mt-2 text-[#b45309] font-semibold">This file format isn’t recognised.</p>
                            ) : (
                                <>
                                    <div className="font-semibold text-[12.5px] text-[#9A9AAE] mt-4 mb-[9px]">This import will create / update:</div>
                                    <ul className="m-0 pl-[18px] flex flex-col gap-1.5 font-semibold text-[13px] text-[#54546A]">
                                        <li>{ prepared.totals.tables } specification table{ 1 === prepared.totals.tables ? '' : 's' }</li>
                                        <li>{ prepared.totals.groups } group{ 1 === prepared.totals.groups ? '' : 's' } ({ prepared.totals.attributes } attributes)</li>
                                        <li>{ prepared.totals.products } product{ 1 === prepared.totals.products ? '' : 's' }</li>
                                    </ul>
                                    <div className="flex gap-2.5 mt-[18px]">
                                        <button type="button" onClick={ handleImport } className="h-[38px] px-[18px] bg-[#6B66F7] text-white border-none rounded-[10px] font-bold text-[13.5px] cursor-pointer shadow-[0_5px_14px_-4px_rgba(107,102,247,0.55)] hover:bg-[#5a55e8] transition-colors">Import Now</button>
                                        <button type="button" onClick={ clearFile } className="h-[38px] px-4 bg-white border border-[#E7E7EF] rounded-[10px] font-bold text-[13.5px] text-[#54546A] cursor-pointer hover:bg-[#F5F5F9] transition-colors">Choose another</button>
                                    </div>
                                </>
                            ) }
                        </div>
                    </div>
                ) }

                {/* progress */}
                { importing && progress && (
                    <div className="flex flex-col gap-4">
                        <FileChip spinner />
                        <div className="border border-[#EFEFF4] rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-[9px]">
                                <span className="font-extrabold text-[14px] text-[#23232E]">Importing…</span>
                                <span className="font-extrabold text-[14px] text-[#23232E]">{ overallPct }%</span>
                            </div>
                            <div className="h-2 rounded-full bg-[#ECEBFF] overflow-hidden mb-1.5">
                                <div className="h-full rounded-full bg-[#6B66F7] transition-all duration-200" style={ { width: `${ overallPct }%` } } />
                            </div>
                            <div className="mt-2">
                                { activePhases.map( ( [ key, label ] ) => {
                                    const p = progress[ key ];
                                    const done = p.processed >= p.total;
                                    return (
                                        <div key={ key } className="flex items-center gap-[11px] py-[9px] border-t border-[#F3F3F8]">
                                            { done ? (
                                                <span className="w-5 h-5 rounded-full bg-[#16B391] inline-flex items-center justify-center flex-none">
                                                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M3 7.5 6 10.5 11 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                </span>
                                            ) : (
                                                <span className="w-5 h-5 rounded-full bg-[#ECEBFF] inline-block flex-none" />
                                            ) }
                                            <span className="flex-1 font-semibold text-[13px] text-[#54546A]">{ label }</span>
                                            <span className={ done ? 'font-bold text-[13px] text-[#12A789]' : 'font-semibold text-[13px] text-[#A2A2B4]' }>
                                                { p.processed }/{ p.total }
                                            </span>
                                        </div>
                                    );
                                } ) }
                            </div>
                        </div>
                    </div>
                ) }

                {/* done */}
                { result && (
                    <div className="flex flex-col gap-3.5">
                        <FileChip />
                        <div className="bg-[#ECFDF5] border border-[#BBE9D8] rounded-xl p-[18px]">
                            <div className="flex items-center gap-[9px] mb-[11px]">
                                <span className="w-[26px] h-[26px] flex-none rounded-lg bg-[#D6F5E7] flex items-center justify-center">
                                    <svg width="15" height="15" viewBox="0 0 18 18" fill="none"><path d="M4 9.5 7.5 13 14 5" stroke="#065F46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </span>
                                <span className="font-extrabold text-[14.5px] text-[#065F46]">Import complete.</span>
                            </div>
                            <ul className="m-0 pl-[18px] flex flex-col gap-1.5 font-semibold text-[13px] text-[#0a7f5e]">
                                <li>{ result.tables } table{ 1 === result.tables ? '' : 's' }</li>
                                <li>{ result.groups } group{ 1 === result.groups ? '' : 's' } ({ result.attributes } attributes)</li>
                                <li>{ result.products } product{ 1 === result.products ? '' : 's' }</li>
                            </ul>
                            { result.skipped?.products > 0 && (
                                <div className="font-semibold text-[12.5px] text-[#b45309] mt-3 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#b45309] flex-none" />{ result.skipped.products } product(s) skipped — no matching product found.</div>
                            ) }
                            { result.skipped?.mapping_values > 0 && (
                                <div className="font-semibold text-[12.5px] text-[#b45309] mt-1.5 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#b45309] flex-none" />{ result.skipped.mapping_values } mapping value(s) skipped — category/tag/product not found.</div>
                            ) }
                            <button type="button" onClick={ clearFile } className="mt-4 h-9 px-3.5 bg-white border border-[#CDECDF] rounded-[9px] font-bold text-[12.5px] text-[#065F46] cursor-pointer hover:bg-white/60 transition-colors">Import another file</button>
                        </div>
                    </div>
                ) }
            </div>
            ) }
        </div>
    );
};

export default ImportCard;
