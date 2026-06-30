/* global specificoAdminSettings */
import React, { useState, useEffect } from 'react';
import Api from "./../Utilites/Api";
import Switch from "../components/Switch";
import IndeterminateCheckbox from "../components/IndeterminateCheckbox";

import {
    useReactTable,
    getCoreRowModel,
    flexRender,
} from '@tanstack/react-table'
import TableSearch from "../components/TableSearch";
import DropdownButton from "../components/DropdownButton";
import MultiSelect from "../components/MultiSelect";
import Logo from "../components/Icons/Logo";
import TableFooter from "../components/TableFooter";
import TableHeader from "../components/TableHeader";
import Rotate from "../components/Icons/Rotate";
import DeleteProgress from "../components/DeleteProgress";

// Shared design tokens for the redesigned admin.
const CARD = "bg-white border border-[#ECECF3] rounded-2xl shadow-[0_1px_2px_rgba(20,20,45,0.04),0_18px_40px_-24px_rgba(30,28,80,0.18)]";
const SPEC_GRID = "46px 104px minmax(150px,1fr) 120px 250px 50px";
const FIELD = "w-full !h-[38px] !min-h-[38px] box-border !border !border-[#E7E7EF] !rounded-[10px] !bg-white !px-[14px] !py-0 !m-0 font-medium !text-[14px] !text-[#23232E] !shadow-none !outline-none focus:!border-[#6B66F7] focus:!shadow-[0_0_0_3px_rgba(107,102,247,0.16)] focus:!ring-0";

// Keep group pills on a single line: collapse names longer than two words to
// "first … last" so a long title can't wrap the row onto two lines.
const formatGroupName = ( name ) => {
    const words = String( name ).trim().split( /\s+/ );
    if ( words.length <= 2 ) {
        return name;
    }
    return `${ words[0] } … ${ words[ words.length - 1 ] }`;
};

const columns = [
    {
        id: 'checkbox',
        header: ({ table }) => (
            <IndeterminateCheckbox
                {...{
                    checked: table.getIsAllPageRowsSelected(),
                    indeterminate: table.getIsSomePageRowsSelected(),
                    onChange: table.getToggleAllPageRowsSelectedHandler(),
                }}
            />
        ),
        cell: ({ row }) => (
            <IndeterminateCheckbox
                {...{
                    checked: row.getIsSelected(),
                    disabled: !row.getCanSelect(),
                    indeterminate: row.getIsSomeSelected(),
                    onChange: row.getToggleSelectedHandler(),
                }}
            />
        ),
    },
    {
        accessorKey: 'id',
        header: 'ID',
        cell: info => <span className="font-mono font-semibold text-[13px] text-[#A2A2B4]">{info.getValue()}</span>,
        footer: props => props.column.id,
    },
    {
        accessorKey: 'name',
        header: 'Name',
        cell: info => <span className="text-[#23232E] font-bold">{info.getValue()}</span>,
        footer: props => props.column.id,
    },
    {
        accessorKey: 'status',
        header: 'Status',
        footer: props => props.column.id,
        cell: ( info ) => (
            info.getValue() ? (
                <span className="inline-flex items-center gap-[7px] text-[#12A789] font-bold text-[13px]">
                    <span className="w-[7px] h-[7px] rounded-full bg-[#16B391]" />Active
                </span>
            ) : (
                <span className="inline-flex items-center gap-[7px] text-[#D9483B] font-bold text-[13px]">
                    <span className="w-[7px] h-[7px] rounded-full bg-[#E74C3C]" />Inactive
                </span>
            )
        )
    },
    {
        id: 'groups',
        Header: "Groups",
        accessorKey: 'groups',
        footer: props => props.column.id,
        cell: (info) => {
            const groups = info.getValue();
            const initGroups = groups.slice(0, 2);
            const remainGroups = groups.length - 2;

            return (
                <div className="flex gap-1.5 flex-wrap">
                    {initGroups.map((item, index) => (
                        <span key={index} title={item} className="px-[11px] py-1 rounded-lg bg-[#F2F2F7] text-[#54546A] text-[12.5px] font-semibold whitespace-nowrap">
                            {formatGroupName(item)}
                        </span>
                    ))}
                    {remainGroups > 0 && (
                        <span className="px-[11px] py-1 rounded-lg bg-[#EDEBFF] text-[#6B66F7] text-[12.5px] font-bold">
                            +{remainGroups}
                        </span>
                    )}
                </div>
            );
        },
    }
]

const SpecTable = () => {
    const [data, setData] = useState([]);

    const [ title, setTitle ] = useState('');
    const [ status, setStatus ] = useState( true );
    const [ options, setOptions ] = useState([]);
    const [ selectedGroup, setSelectedGroup ] = useState([]);
    const [ editingId, setEditingId ] = useState(null);
    const [ showForm, setShowForm ] = useState(false);

    const [ isLoading, setIsLoading ] = useState( false );
    const [ deleteProgress, setDeleteProgress ] = useState( null );

    const [ tableCounts, setTableCounts ] = useState( parseInt( specificoAdminSettings.tables ) );
    const [ total, setTotal ] = useState( 0 );

    const [ search, setSearch ] = useState( '' );
    const [ debouncedSearch, setDebouncedSearch ] = useState( '' );

    const PAGE_SIZE_KEY = 'specifico_spec_page_size';
    const getInitialPageSize = () => {
        const stored = parseInt( localStorage.getItem( PAGE_SIZE_KEY ), 10 );
        return [ 10, 25, 50, 100, 200, 500 ].includes( stored ) ? stored : 10;
    };
    const [ pagination, setPagination ] = useState( { pageIndex: 0, pageSize: getInitialPageSize() } );

    useEffect(() => {
        localStorage.setItem( PAGE_SIZE_KEY, String( pagination.pageSize ) );
    }, [ pagination.pageSize ]);

    const table = useReactTable({
        data,
        columns,
        state: { pagination },
        onPaginationChange: setPagination,
        manualPagination: true,
        rowCount: total,
        getCoreRowModel: getCoreRowModel(),
        getRowId: row => row.id
    });

    // Debounce the search box before hitting the server, and snap back to the
    // first page whenever the term changes.
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch( search );
            setPagination( prev => prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 } );
        }, 400);
        return () => clearTimeout( timer );
    }, [ search ]);

    // Server-side pagination: refetch whenever the page, page size, or the
    // (debounced) search term changes.
    useEffect(() => {
        fetchData();
    }, [ pagination.pageIndex, pagination.pageSize, debouncedSearch ]);

    useEffect(() => {
        fetchGroupsSelect();
    }, []);

    const resetForm = () => {
        setTitle('');
        setStatus(true);
        setSelectedGroup([]);
        setEditingId(null);
    };

    const handleOpenAddPanel = () => {
        resetForm();
        setShowForm(true);
    };

    const handleEditClick = async (postId) => {
        setEditingId(postId);
        setShowForm(true);
        try {
            setIsLoading(true);
            const response = await Api.get(`/specifico/v1/specification/${postId}`);
            setTitle(response.data.name);
            setStatus(response.data.status);
            setSelectedGroup(response.data.groups);
        } catch (error) {
            console.error('Error fetching specification:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveAndClose = async () => {
        if (!title.trim()) return;
        setShowForm(false);
        if (editingId) {
            await updatePost(editingId);
        } else {
            await createPost();
        }
        resetForm();
    };

    const handleCancel = () => {
        resetForm();
        setShowForm(false);
    };

    const fetchData = async () => {
        try {
            setIsLoading( true );
            const response = await Api.get('/specifico/v1/specification', {
                params: {
                    page: pagination.pageIndex + 1,
                    per_page: pagination.pageSize,
                    search: debouncedSearch || undefined,
                }
            });
            const rows = Array.isArray( response.data.rows ) ? response.data.rows : [];
            const totalRows = parseInt( response.data.total, 10 ) || 0;
            setData( rows );
            setTotal( totalRows );
            // Without an active search the server total is the authoritative
            // overall count, so keep the empty-state gate in sync with it.
            if ( ! debouncedSearch ) {
                setTableCounts( totalRows );
            }
            // If a deletion emptied the current page, step back to the last
            // page that still has rows.
            const lastPage = Math.max( Math.ceil( totalRows / pagination.pageSize ) - 1, 0 );
            if ( totalRows > 0 && rows.length === 0 && pagination.pageIndex > lastPage ) {
                setPagination( prev => ({ ...prev, pageIndex: lastPage }) );
            }
        } catch (error) {
            console.error('Error fetching specifications:', error);
        } finally {
            setIsLoading( false );
        }
    };

    const createPost = async () => {
        try {
            setIsLoading( true );
            await Api.post(
                '/specifico/v1/specification',
                {
                    title: title,
                    status: 'publish',
                    meta: {
                        _specifico_status: status,
                        _specifico_groups: selectedGroup,
                    }
                }
            );
            await fetchData();
        } catch (error) {
            console.error('Error creating specification:', error);
        } finally {
            setIsLoading( false );
        }
    };

    const updatePost = async (postId) => {
        try {
            setIsLoading( true );
            await Api.put(
                `/specifico/v1/specification/${postId}`,
                {
                    title: title,
                    meta: {
                        _specifico_status: status,
                        _specifico_groups: selectedGroup,
                    }
                }
            );
            await fetchData();
        } catch (error) {
            console.error('Error updating specification:', error);
        } finally {
            setIsLoading( false );
        }
    };

    const deletePost = async (postId) => {
        try {
            setIsLoading( true );
            await Api.delete(`/specifico/v1/specification/${postId}`);
            await fetchData();
        } catch (error) {
            console.error('Error deleting specification:', error);
        } finally {
            setIsLoading( false );
        }
    };

    const deletePosts = async (posts) => {
        if ( ! posts || ! posts.length ) return;

        const total = posts.length;
        let done = 0;
        setDeleteProgress( { total, done } );

        // Bring the progress card into view at the top of the page.
        window.scrollTo( { top: 0, behavior: 'smooth' } );

        // Bounded concurrency: process a few deletes at a time instead of firing
        // all of them at once, so large bulk deletes don't overwhelm the server
        // and we can report progress as each one finishes.
        const queue = [ ...posts ];
        const concurrency = Math.min( 5, total );
        const worker = async () => {
            while ( queue.length ) {
                const postId = queue.shift();
                try {
                    await Api.delete(`/specifico/v1/specification/${postId}`);
                } catch (error) {
                    console.error('Error deleting specification:', postId, error);
                }
                done++;
                setDeleteProgress( { total, done } );
            }
        };

        try {
            await Promise.all( Array.from( { length: concurrency }, worker ) );
            table.resetRowSelection();
            await fetchData();
        } catch (error) {
            console.error('Error deleting specifications:', error);
        } finally {
            setDeleteProgress( null );
        }
    };

    const fetchGroupsSelect = async () => {
        try {
            setIsLoading( true );
            const response = await Api.get('/specifico/v1/groups/select');
            setOptions( response.data );
        } catch (error) {
            console.error('Error fetching groups select:', error);
        } finally {
            setIsLoading( false );
        }
    };

    const primaryBtn = "whitespace-nowrap inline-flex items-center gap-[7px] h-[38px] px-[18px] bg-[#6B66F7] text-white border-none rounded-[11px] font-bold text-[13.5px] cursor-pointer shadow-[0_5px_14px_-4px_rgba(107,102,247,0.55)] hover:bg-[#5a55e8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
    const secondaryBtn = "whitespace-nowrap inline-flex items-center gap-[7px] h-[38px] px-[18px] bg-white border border-[#E7E7EF] rounded-[11px] text-[#54546A] font-bold text-[13.5px] cursor-pointer hover:bg-[#F5F5F9] transition-colors";

    return (
        <div className="font-['Nunito'] text-sm mt-5 mr-5 relative text-[#54546A]">
            {/* page header card */}
            <div className={`${CARD} flex items-center justify-between gap-4 px-6 py-[18px] mb-5`}>
                <div className="flex items-center gap-[15px]">
                    <span className="w-10 [&_svg]:w-10 [&_svg]:h-auto block"><Logo /></span>
                    <div>
                        <div className="font-extrabold text-[19px] text-[#23232E] tracking-[-0.2px]">Specification Tables</div>
                        <div className="font-medium text-[13px] text-[#9A9AAE] mt-0.5">Here are your specification tables. You can edit or delete them.</div>
                    </div>
                </div>
                <div className="flex-none flex gap-2.5">
                    { showForm ?
                        <>
                            <button type="button" onClick={handleCancel} className={secondaryBtn}>Cancel</button>
                            <button type="button" disabled={!title.trim()} className={primaryBtn} onClick={handleSaveAndClose}>
                                { editingId ?
                                    <><Rotate /> Update Specification</>
                                    :
                                    <><span className="text-[18px] leading-none -mt-px">+</span> Save Specification</>
                                }
                            </button>
                        </>
                        :
                        <button onClick={handleOpenAddPanel} className={primaryBtn}>
                            <span className="text-[18px] leading-none -mt-px">+</span> Add Specification
                        </button>
                    }
                </div>
            </div>

            { ! showForm && (
                <div>
                    { deleteProgress && <DeleteProgress done={deleteProgress.done} total={deleteProgress.total} /> }

                    { tableCounts > 0 ?
                        <div className={`${CARD} overflow-hidden`}>
                            <TableSearch value={search} onChange={setSearch} placeholder="Search specifications…" count={total} noun="tables" />
                            <TableHeader table={table} template={SPEC_GRID} />
                            <div>
                                { ! isLoading ?
                                    <>
                                        { table.getRowModel().rows.map(row =>
                                            <div className="grid items-center px-[22px] py-[15px] border-b border-[#F3F3F8] font-medium text-[14px] hover:bg-[#FAFAFB]" style={{ gridTemplateColumns: SPEC_GRID }} key={row.id}>
                                                { row.getVisibleCells().map(cell =>
                                                    <span key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</span>
                                                ) }
                                                <span className="text-right">
                                                    <DropdownButton>
                                                        <button onClick={() => handleEditClick(row.id)} className="block w-full text-left px-3 py-2 rounded-lg font-semibold text-[13.5px] text-[#3A3A45] hover:bg-[#F5F5F9] transition-colors">Edit</button>
                                                        <button type="button" onClick={() => deletePost(row.id)} className="block w-full text-left px-3 py-2 rounded-lg font-semibold text-[13.5px] text-[#dc2626] hover:bg-[#FEF2F2] transition-colors">Delete</button>
                                                    </DropdownButton>
                                                </span>
                                            </div>
                                        ) }
                                        { total === 0 &&
                                            <div className="px-[22px] py-12 text-center text-[#9A9AAE]">No specifications match your search.</div>
                                        }
                                    </>
                                    :
                                    [0,1,2,3,4,5].map(k =>
                                        <div className="grid items-center px-[22px] py-[17px] border-b border-[#F3F3F8] gap-3" style={{ gridTemplateColumns: SPEC_GRID }} key={k}>
                                            <span className="w-4 h-4 rounded bg-[#ECEBFF] animate-pulse" />
                                            <span className="w-16 h-[13px] rounded bg-[#ECEBFF] animate-pulse" />
                                            <span className="w-3/5 h-[13px] rounded bg-[#ECEBFF] animate-pulse" />
                                            <span className="w-16 h-[13px] rounded bg-[#ECEBFF] animate-pulse" />
                                            <span className="flex gap-1.5"><span className="w-[62px] h-[22px] rounded-lg bg-[#ECEBFF] animate-pulse" /><span className="w-[62px] h-[22px] rounded-lg bg-[#ECEBFF] animate-pulse" /></span>
                                            <span className="w-6 h-6 rounded-lg bg-[#ECEBFF] animate-pulse justify-self-end" />
                                        </div>
                                    )
                                }
                            </div>
                            <TableFooter table={table} deletePosts={deletePosts} totalRows={total} />
                        </div>
                        :
                        <div className={`${CARD} px-6 py-16 flex flex-col items-center text-center`}>
                            <div className="w-[62px] h-[62px] rounded-2xl bg-[#F2F1FF] flex items-center justify-center mb-[18px]">
                                <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><rect x="4" y="3" width="18" height="20" rx="3" stroke="#6B66F7" strokeWidth="1.8"/><line x1="8" y1="9" x2="18" y2="9" stroke="#6B66F7" strokeWidth="1.8" strokeLinecap="round"/><line x1="8" y1="13" x2="18" y2="13" stroke="#B7B4FF" strokeWidth="1.8" strokeLinecap="round"/><line x1="8" y1="17" x2="14" y2="17" stroke="#B7B4FF" strokeWidth="1.8" strokeLinecap="round"/></svg>
                            </div>
                            <div className="font-extrabold text-[17px] text-[#23232E]">No specification tables yet</div>
                            <div className="font-medium text-[13.5px] text-[#9A9AAE] mt-1.5 max-w-[380px]">Create your first table to define the specs that appear on your WooCommerce products.</div>
                            <button onClick={handleOpenAddPanel} className={`${primaryBtn} mt-5`}>
                                <span className="text-[18px] leading-none -mt-px">+</span> Add Specification
                            </button>
                        </div>
                    }
                </div>
            )}

            { showForm && (
                <div className={`${CARD} overflow-hidden`}>
                    <div className="px-6 py-4 border-b border-[#EFEFF4] font-extrabold text-[15px] text-[#23232E]">Specification Table</div>
                    <div className="grid grid-cols-[200px_1fr] items-center gap-5 px-6 py-5 border-b border-[#F3F3F8]">
                        <label htmlFor="spec-title" className="font-bold text-[13px] text-[#3A3A45]">Table Name</label>
                        <input id="spec-title" type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Table Name" className={FIELD} />
                    </div>
                    <div className="grid grid-cols-[200px_1fr] items-center gap-5 px-6 py-5 border-b border-[#F3F3F8]">
                        <div>
                            <div className="font-bold text-[13px] text-[#3A3A45]">Status</div>
                            <div className="font-medium text-[12px] text-[#9A9AAE] mt-0.5">Active tables render on matching products.</div>
                        </div>
                        <div><Switch bare id="spec-status" checked={status} onChange={() => setStatus((prev) => !prev)} /></div>
                    </div>
                    <div className="grid grid-cols-[200px_1fr] items-start gap-5 px-6 py-5">
                        <label className="font-bold text-[13px] text-[#3A3A45] pt-2.5">Groups</label>
                        <MultiSelect bare id="group-selector" isMulti placeholder="Add group…" value={selectedGroup} onChange={(Groups) => setSelectedGroup(Groups)} options={options} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpecTable;
