/* global specificoAdminSettings */
import React, { useState, useEffect } from 'react';
import Api from "./../Utilites/Api";
import TextInput from "../components/TextInput";
import Switch from "../components/Switch";
import IndeterminateCheckbox from "../components/IndeterminateCheckbox";

import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,
} from '@tanstack/react-table'
import DropdownButton from "../components/DropdownButton";
import MultiSelect from "../components/MultiSelect";
import Logo from "../components/Icons/Logo";
import TableFooter from "../components/TableFooter";
import TableHeader from "../components/TableHeader";
import Rotate from "../components/Icons/Rotate";
import Edit from "../components/Icons/Edit";
import Delete from "../components/Icons/Delete";
import SpecLoader from "../components/Loader/SpecLoader";
import EmptySection from "../components/EmptySection";

const columns = [
    {
        id: 'checkbox',
        header: ({ table }) => (
            <IndeterminateCheckbox
                {...{
                    checked: table.getIsAllRowsSelected(),
                    indeterminate: table.getIsSomeRowsSelected(),
                    onChange: table.getToggleAllRowsSelectedHandler(),
                }}
            />
        ),
        cell: ({ row }) => (
            <div className="">
                <IndeterminateCheckbox
                    {...{
                        checked: row.getIsSelected(),
                        disabled: !row.getCanSelect(),
                        indeterminate: row.getIsSomeSelected(),
                        onChange: row.getToggleSelectedHandler(),
                    }}
                />
            </div>
        ),
    },
    {
        accessorKey: 'id',
        header: 'ID',
        cell: info => info.getValue(),
        footer: props => props.column.id,
    },
    {
        accessorKey: 'name',
        header: 'Name',
        cell: info => info.getValue(),
        footer: props => props.column.id,
    },
    {
        accessorKey: 'status',
        header: 'Status',
        footer: props => props.column.id,
        cell: ( info ) => {
            const status = info.getValue() ? 'active' : 'inactive';

            return (
                <div className={ info.getValue() ? "px-2 py-[5px] inline-block capitalize rounded-full leading-none border border-[#1ABC9C] text-[#1ABC9C] bg-[#F1FDF8]" : "px-2 py-[5px] inline-block capitalize rounded-full leading-none border border-[#E74C3C] text-[#E74C3C] bg-[#FFF2F2]" }>{status}</div>
            )
        }
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
                <div className="flex gap-2">
                    {initGroups.map((item, index) => (
                        <div key={index} className="px-2 py-[5px] inline-block capitalize rounded-full leading-none border border-[#E9E8FE]">
                            {item}
                        </div>
                    ))}
                    {remainGroups > 0 && (
                        <div className="px-2 py-[5px] inline-block capitalize rounded-full leading-none border border-[#E9E8FE]">
                            +{remainGroups}
                        </div>
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

    const [ tableCounts, setTableCounts ] = useState( parseInt( specificoAdminSettings.tables ) );

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getRowId: row => row.id
    });

    useEffect(() => {
        fetchData();
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
            const response = await Api.get('/specifico/v1/specification');
            setData(response.data);
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
            setTableCounts( parseInt( specificoAdminSettings.tables ) + 1 );
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
            setTableCounts( parseInt( specificoAdminSettings.tables ) );
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
            setTableCounts( parseInt( specificoAdminSettings.tables ) - 1 );
            await fetchData();
        } catch (error) {
            console.error('Error deleting specification:', error);
        } finally {
            setIsLoading( false );
        }
    };

    const deletePosts = async (posts) => {
        try {
            setIsLoading( true );
            await Promise.all(
                posts.map(async (postId) => {
                    await Api.delete(`/specifico/v1/specification/${postId}`);
                    setTableCounts( parseInt( specificoAdminSettings.tables ) - 1 );
                })
            );
            await fetchData();
        } catch (error) {
            console.error('Error deleting specification:', error);
        } finally {
            setIsLoading( false );
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


    return (
        <div className="font-['Nunito'] text-sm mt-5 mr-5 relative">
            <div className="flex bg-white drop-shadow-[0_0_4px_rgba(26,26,26,0.15)] px-5 py-4 mb-5 items-center rounded">
                <div className="flex flex-auto gap-3 items-center">
                    <Logo />
                    <div>
                        <h1 className="text-lg font-semibold text-[#333333]">Specification Tables</h1>
                        <p className="text-[#555555]">Here are your specification tables. You can edit or delete them.</p>
                    </div>
                </div>
                <div className="flex-initial text-right flex gap-2">
                    { showForm &&
                        <>
                            <button type="button" onClick={handleCancel} className="px-3.5 py-2.5 bg-white border border-[#E9E8FE] rounded text-[#555555]">
                                Cancel
                            </button>
                            <button type="button" disabled={!title.trim()} className="flex gap-1 items-center px-3.5 py-2.5 bg-[#6B66F7] rounded text-white disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleSaveAndClose}>
                                { editingId ?
                                    <>
                                        <Rotate />
                                        Update Specification
                                    </>
                                    :
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 3.333v9.334M3.333 8h9.334"/></svg>
                                        Save Specification
                                    </>
                                }
                            </button>
                        </>
                    }

                    { ! showForm &&
                        <button onClick={handleOpenAddPanel} className="flex gap-1 items-center px-3.5 py-2.5 bg-[#6B66F7] rounded text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 3.333v9.334M3.333 8h9.334"/></svg>
                            Add Specification
                        </button>
                    }
                </div>
            </div>

            { ! showForm && (
                <div className="bg-white drop-shadow-[0_0_4px_rgba(26,26,26,0.15)] rounded">
                    { tableCounts > 0 &&
                        <>
                            <TableHeader table={table} />
                            <div>
                                { ! isLoading &&
                                    <>
                                        {
                                            table.getRowModel().rows.length > 0 &&
                                            table.getRowModel().rows.map(row =>
                                                <div className="flex px-5 py-4 gap-5 border-t border-[#F2F1FE] items-center" key={row.id}>
                                                    {row.getVisibleCells().map(cell =>
                                                        <div className={cell.id.includes('checkbox') ? 'flex-initial w-[5%] max-w-3.5 text-[#555555]' : 'flex-initial w-[19%] text-[#555555]'} key={cell.id}> {flexRender(cell.column.columnDef.cell, cell.getContext())}</div>
                                                    )}
                                                    <div className="flex-initial w-[19%] text-[#555555] text-right">
                                                        <DropdownButton>
                                                            <button onClick={() => handleEditClick(row.id)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#555555] hover:bg-[#F5F5FE] hover:text-[#333333] transition-colors">
                                                                <Edit />
                                                                Edit
                                                            </button>
                                                            <button type="button" className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#E74C3C] hover:bg-[#FFF2F2] transition-colors" onClick={() => deletePost(row.id)}>
                                                                <Delete />
                                                                Delete
                                                            </button>
                                                        </DropdownButton>
                                                    </div>
                                                </div>
                                            )
                                        }
                                    </>
                                }
                                {
                                    isLoading &&
                                    <SpecLoader count={specificoAdminSettings.tables} />
                                }
                            </div>
                            <TableFooter table={table} deletePosts={deletePosts} />
                        </>
                    }
                    { tableCounts <= 0 &&
                        <EmptySection title="Specification not found" desc="Sorry ! No Specification table found. You can add specification by clicking add specification button" />
                    }
                </div>
            )}

            { showForm && (
                <div>
                    <div className="bg-white drop-shadow-[0_0_4px_rgba(26,26,26,0.15)] mb-5 items-center rounded">
                        <h2 className="bg-[#F5F5FE] px-5 py-4 text-[15px] font-semibold rounded-tl rounded-tr">
                            Specification Table
                        </h2>
                        <div className="px-5">
                            <div className="relative before:content-[''] before:w-full before:h-px before:bg-dash-border before:bg-repeat-x before:absolute before:bottom-0">
                                <TextInput type="text" placeholder="Table Name" id="spec-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
                            </div>
                            <div className="relative before:content-[''] before:w-full before:h-px before:bg-dash-border before:bg-repeat-x before:absolute before:bottom-0">
                                <Switch placeholder="Status" checked={status} onChange={() => setStatus((prev) => !prev)} />
                            </div>
                            <div className="relative">
                                <MultiSelect id="group-selector" isMulti placeholder="Groups" value={selectedGroup} onChange={(Groups) => setSelectedGroup(Groups)} options={options} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpecTable;
