/* global specificoAdminSettings */
import React, { useState, useEffect } from 'react';
import Api from "./../Utilites/Api";
import IndeterminateCheckbox from "../components/IndeterminateCheckbox";
import PostMetaRepeater from "../components/PostMetaRepeater";
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
} from '@tanstack/react-table'
import TableSearch from "../components/TableSearch";
import DropdownButton from "../components/DropdownButton";
import Logo from "../components/Icons/Logo"
import TableHeader from "../components/TableHeader";
import TableFooter from "../components/TableFooter";
import Rotate from "../components/Icons/Rotate";
import DeleteProgress from "../components/DeleteProgress";

const CARD = "bg-white border border-[#ECECF3] rounded-2xl shadow-[0_1px_2px_rgba(20,20,45,0.04),0_18px_40px_-24px_rgba(30,28,80,0.18)]";
const GROUP_GRID = "46px 120px minmax(150px,1fr) minmax(150px,1fr) 50px";
const FIELD = "w-full !h-[38px] !min-h-[38px] box-border !border !border-[#E7E7EF] !rounded-[10px] !bg-white !px-[14px] !py-0 !m-0 font-medium !text-[14px] !text-[#23232E] !shadow-none !outline-none focus:!border-[#6B66F7] focus:!shadow-[0_0_0_3px_rgba(107,102,247,0.16)] focus:!ring-0";

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
        accessorKey: 'slug',
        header: 'Slug',
        cell: info => <span className="font-mono font-semibold text-[13px] text-[#9A9AAE]">{info.getValue()}</span>,
        footer: props => props.column.id,
    },
]

const GroupsTable = () => {
    const [ data, setData] = useState([]);
    const [ title, setTitle ] = useState('');
    const [attributes, setAttributes] = useState([
        { attributeName: '', attributeValue: '', attributeType: 'text', defaultValue: '' }
    ]);
    const [ isEditing, setIsEditing ] = useState( '' );
    const [ showAttributeSection, setShowAttributeSection] = useState(false);

    const [ groupCounts, setGroupCounts ] = useState( parseInt( specificoAdminSettings.groups ) );
    const [ total, setTotal ] = useState( 0 );

    const [ search, setSearch ] = useState( '' );
    const [ debouncedSearch, setDebouncedSearch ] = useState( '' );

    const [ isLoading, setIsLoading ] = useState( false );
    const [ deleteProgress, setDeleteProgress ] = useState( null );

    const resetForm = () => {
        setTitle('');
        setAttributes([{ attributeName: '', attributeValue: '', attributeType: 'text', defaultValue: '' }]);
        setIsEditing('');
    };

    const handleOpenAddPanel = () => {
        resetForm();
        setShowAttributeSection(true);
    };

    const handleSaveAndClose = async () => {
        if (!title.trim()) return;
        setShowAttributeSection(false);

        if ( isEditing ) {
            await updatePost( isEditing );
        } else {
            await createPost();
        }
        resetForm();
    };

    const handleCancel = () => {
        resetForm();
        setShowAttributeSection(false);
    };

    const PAGE_SIZE_KEY = 'specifico_groups_page_size';
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

    const fetchData = async () => {
        try {
            setIsLoading( true );
            const response = await Api.get('/specifico/v1/groups', {
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
                setGroupCounts( totalRows );
            }
            // If a deletion emptied the current page, step back to the last
            // page that still has rows.
            const lastPage = Math.max( Math.ceil( totalRows / pagination.pageSize ) - 1, 0 );
            if ( totalRows > 0 && rows.length === 0 && pagination.pageIndex > lastPage ) {
                setPagination( prev => ({ ...prev, pageIndex: lastPage }) );
            }
        } catch (error) {
            console.error('Error fetching groups:', error);
        } finally {
            setIsLoading( false );
        }
    };

    const fetchGroup = async ( postId ) => {
        setIsEditing( postId );
        setShowAttributeSection( true );
        try {
            setIsLoading( true );
            const response = await Api.get(`/specifico/v1/groups/${postId}`);
            setTitle( response.data.name );
            setAttributes(response.data.attr);
        } catch (error) {
            console.error('Error fetching groups:', error);
        } finally {
            setIsLoading( false );
        }
    };

    const createPost = async () => {
        try {
            setIsLoading( true );
            await Api.post(
                '/specifico/v1/groups',
                {
                    title: title,
                    status: 'publish',
                    meta: {
                        _specifico_attr: attributes,
                    }
                }
            );
            await fetchData(); // Fetch posts again to update the list
        } catch (error) {
            console.error('Error creating group:', error);
        } finally {
            setIsLoading( false );
        }
    };

    const updatePost = async (postId) => {
        try {
            setIsLoading( true );
            await Api.put(
                `/specifico/v1/groups/${postId}`,
                {
                    title: title,
                    meta: {
                        _specifico_attr: attributes,
                    }
                }
            );
            await fetchData(); // Fetch posts again to update the list
        } catch (error) {
            console.error('Error updating group:', error);
        } finally {
            setIsLoading( false );
        }
    };

    const deletePost = async (postId) => {
        try {
            setIsLoading( true );
            await Api.delete(`/specifico/v1/groups/${postId}`);
            fetchData(); // Fetch posts again to update the list
        } catch (error) {
            console.error('Error deleting group:', error);
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
                    await Api.delete(`/specifico/v1/groups/${postId}`);
                } catch (error) {
                    console.error('Error deleting group:', postId, error);
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
            console.error('Error deleting groups:', error);
        } finally {
            setDeleteProgress( null );
        }
    };

    const handleAddField = () => {
        setAttributes([...attributes, { attributeName: '', attributeValue: '', attributeType: 'text', defaultValue: '' }]);
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

    const primaryBtn = "whitespace-nowrap inline-flex items-center gap-[7px] h-[38px] px-[18px] bg-[#6B66F7] text-white border-none rounded-[11px] font-bold text-[13.5px] cursor-pointer shadow-[0_5px_14px_-4px_rgba(107,102,247,0.55)] hover:bg-[#5a55e8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
    const secondaryBtn = "whitespace-nowrap inline-flex items-center gap-[7px] h-[38px] px-[18px] bg-white border border-[#E7E7EF] rounded-[11px] text-[#54546A] font-bold text-[13.5px] cursor-pointer hover:bg-[#F5F5F9] transition-colors";

    return (
        <div className="font-['Nunito'] text-sm mt-5 mr-5 relative text-[#54546A]">
            {/* page header card */}
            <div className={`${CARD} flex items-center justify-between gap-4 px-6 py-[18px] mb-5`}>
                <div className="flex items-center gap-[15px]">
                    <span className="w-10 [&_svg]:w-10 [&_svg]:h-auto block"><Logo /></span>
                    <div>
                        <div className="font-extrabold text-[19px] text-[#23232E] tracking-[-0.2px]">Specification Groups</div>
                        <div className="font-medium text-[13px] text-[#9A9AAE] mt-0.5">Here are your groups tables. You can edit or delete them.</div>
                    </div>
                </div>
                <div className="flex-none flex gap-2.5">
                    { showAttributeSection ?
                        <>
                            <button type="button" onClick={handleCancel} className={secondaryBtn}>Cancel</button>
                            <button type="button" disabled={!title.trim()} className={primaryBtn} onClick={handleSaveAndClose}>
                                { isEditing ?
                                    <><Rotate /> Update Group</>
                                    :
                                    <><span className="text-[18px] leading-none -mt-px">+</span> Save Group</>
                                }
                            </button>
                        </>
                        :
                        <button onClick={handleOpenAddPanel} className={primaryBtn}>
                            <span className="text-[18px] leading-none -mt-px">+</span> Add Group
                        </button>
                    }
                </div>
            </div>

            { ! showAttributeSection && (
                <div>
                    { deleteProgress && <DeleteProgress done={deleteProgress.done} total={deleteProgress.total} /> }

                    { groupCounts > 0 ?
                        <div className={`${CARD} overflow-hidden`}>
                            <TableSearch value={search} onChange={setSearch} placeholder="Search groups…" count={total} noun="groups" />
                            <TableHeader table={table} template={GROUP_GRID} />
                            <div>
                                { ! isLoading ?
                                    <>
                                        { table.getRowModel().rows.map(row =>
                                            <div className="grid items-center px-[22px] py-[15px] border-b border-[#F3F3F8] font-medium text-[14px] hover:bg-[#FAFAFB]" style={{ gridTemplateColumns: GROUP_GRID }} key={row.id}>
                                                { row.getVisibleCells().map(cell =>
                                                    <span key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</span>
                                                ) }
                                                <span className="text-right">
                                                    <DropdownButton>
                                                        <button onClick={() => fetchGroup(row.id)} className="block w-full text-left px-3 py-2 rounded-lg font-semibold text-[13.5px] text-[#3A3A45] hover:bg-[#F5F5F9] transition-colors">Edit</button>
                                                        <button type="button" onClick={() => deletePost(row.id)} className="block w-full text-left px-3 py-2 rounded-lg font-semibold text-[13.5px] text-[#dc2626] hover:bg-[#FEF2F2] transition-colors">Delete</button>
                                                    </DropdownButton>
                                                </span>
                                            </div>
                                        ) }
                                        { total === 0 &&
                                            <div className="px-[22px] py-12 text-center text-[#9A9AAE]">No groups match your search.</div>
                                        }
                                    </>
                                    :
                                    [0,1,2,3,4,5].map(k =>
                                        <div className="grid items-center px-[22px] py-[17px] border-b border-[#F3F3F8] gap-3" style={{ gridTemplateColumns: GROUP_GRID }} key={k}>
                                            <span className="w-4 h-4 rounded bg-[#ECEBFF] animate-pulse" />
                                            <span className="w-16 h-[13px] rounded bg-[#ECEBFF] animate-pulse" />
                                            <span className="w-3/5 h-[13px] rounded bg-[#ECEBFF] animate-pulse" />
                                            <span className="w-2/5 h-[13px] rounded bg-[#ECEBFF] animate-pulse" />
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
                                <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><rect x="3" y="5" width="9" height="7" rx="2" stroke="#6B66F7" strokeWidth="1.8"/><rect x="14" y="5" width="9" height="7" rx="2" stroke="#B7B4FF" strokeWidth="1.8"/><rect x="3" y="15" width="9" height="7" rx="2" stroke="#B7B4FF" strokeWidth="1.8"/><rect x="14" y="15" width="9" height="7" rx="2" stroke="#6B66F7" strokeWidth="1.8"/></svg>
                            </div>
                            <div className="font-extrabold text-[17px] text-[#23232E]">No groups yet</div>
                            <div className="font-medium text-[13.5px] text-[#9A9AAE] mt-1.5 max-w-[380px]">Create a group to organise the attributes that make up your specification tables.</div>
                            <button onClick={handleOpenAddPanel} className={`${primaryBtn} mt-5`}>
                                <span className="text-[18px] leading-none -mt-px">+</span> Add Group
                            </button>
                        </div>
                    }
                </div>
            )}

            { showAttributeSection && (
                <div className="flex flex-col gap-5">
                    <div className={`${CARD} overflow-hidden`}>
                        <div className="px-6 py-4 border-b border-[#EFEFF4] font-extrabold text-[15px] text-[#23232E]">Group Name</div>
                        <div className="grid grid-cols-[200px_1fr] items-center gap-5 px-6 py-5">
                            <label htmlFor="post-title" className="font-bold text-[13px] text-[#3A3A45]">Enter Group Name</label>
                            <input id="post-title" type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Group name" className={FIELD} />
                        </div>
                    </div>

                    <div className={`${CARD} overflow-hidden`}>
                        <div className="grid grid-cols-[1fr_1fr_1fr_48px] gap-3.5 px-6 py-3.5 border-b border-[#EFEFF4] font-bold text-[10.5px] tracking-[0.09em] uppercase text-[#A2A2B4]">
                            <span>Attribute Type</span><span>Attribute Value</span><span>Values</span><span></span>
                        </div>
                        <PostMetaRepeater
                            metaFields={attributes}
                            onAddField={handleAddField}
                            onChange={handleChange}
                            onRemoveField={handleRemoveField}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupsTable;
