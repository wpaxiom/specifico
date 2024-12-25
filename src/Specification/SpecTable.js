/* global specificoAdminSettings */
import React, { useState, useEffect } from 'react';
import Api from "./../Utilites/Api";
import TextInput from "../components/TextInput";
import Switch from "../components/Switch";
import Button from "../components/Button";
import IndeterminateCheckbox from "../components/IndeterminateCheckbox";
import SpecModal from "../components/SpecModal";

import {
    Column,
    Table as ReactTable,
    PaginationState,
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    ColumnDef,
    OnChangeFn,
    flexRender,
} from '@tanstack/react-table'
import DropdownButton from "../components/DropdownButton";
import MultiSelect from "../components/MultiSelect";
import Logo from "../components/Icons/Logo";
import TableFooter from "../components/TableFooter";
import TableHeader from "../components/TableHeader";
import Add from "../components/Icons/Add";
import Rotate from "../components/Icons/Rotate";
import SpecLoader from "../components/Loader/SpecLoader";
import EmptySection from "../components/EmptySection";
import tableFooter from "../components/TableFooter";

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
            // Get the first two items
            const initGroups = groups.slice(0, 2);
            // Calculate the count of the remaining items
            const remainGroups = groups.length - 2;

            return (
                <div className="flex gap-2">
                    {initGroups.map((item, index) => (
                        <div className="px-2 py-[5px] inline-block capitalize rounded-full leading-none border border-[#E9E8FE]">
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

const SpecTable = ( {postId} ) => {
    const [data, setData] = useState([]);;

    const [ title, setTitle ] = useState('');
    const [ status, setStatus ] = useState( true );
    const [ options, setOptions ] = useState([]);
    const [ selectedGroup, setSelectedGroup ] = useState([]);

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

    // Fetch posts on component mount
    useEffect(() => {
        if ( postId ){
            fetchSpec(postId);
        }
        fetchData();
        fetchGroupsSelect();
    }, [postId]);

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

    const fetchSpec = async ( postId ) => {
        openModal( 'model2' );
        try {
            setIsLoading( true );
            const response = await Api.get(`/specifico/v1/specification/${postId}`);
            setTitle(response.data.name);
            setStatus(response.data.status);
            setSelectedGroup(response.data.groups);
        } catch (error) {
            console.error('Error fetching specification:', error);
        } finally {
            setIsLoading( false );
        }
    };

    const createPost = async () => {
        closeModal( 'modal1' );
        try {
            setIsLoading( true );
            const response = await Api.post(
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
            await fetchData(); // Fetch posts again to update the list
        } catch (error) {
            console.error('Error creating specification:', error);
        } finally {
            setIsLoading( false );
        }
    };

    const handleFetchSpec = async (postID) => {
        openModal( 'modal2' );
        try {
            const response = await Api.get(`/specifico/v1/specification/${postID}`);
            setTitle( response.data.name );
            setStatus( response.data.status );
            setSelectedGroup( response.data.groups);
        } catch (error) {
            console.error('Error updating specification:', error);
        }
    }

    const updatePost = async (postId) => {
        closeModal( 'modal2' );
        try {
            setIsLoading( true );
            const response = await Api.put(
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
            await fetchData(); // Fetch posts again to update the list
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
            await fetchData(); // Fetch posts again to update the list
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
            // After deleting all posts, fetch the updated list of posts
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
            console.error('Error fetching posts:', error);
        } finally {
            setIsLoading( false );
        }
    };

    const [modals, setModals] = useState({
        modal1: false,
        modal2: false,
    });

    const openModal = (modalId) => {
        setModals((prevModals) => ({
            ...prevModals,
            [modalId]: true,
        }));
    };

    const closeModal = (modalId) => {
        setModals((prevModals) => ({
            ...prevModals,
            [modalId]: false,
        }));
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
                <div className="flex-initial text-right">
                    <button onClick={() => openModal('modal1')} className="flex gap-1 items-center px-3.5 py-2.5 bg-[#6B66F7] rounded text-white">
                        <Add />
                        Add Specification
                    </button>
                    <SpecModal isOpen={modals.modal1} onRequestClose={() => closeModal('modal1')} label="Add Specification">
                        <TextInput type="text" placeholder="Table Name" id="post-title" required value={title} onChange={(e) => {setTitle(e.target.value)}}/>
                        <Switch placeholder="Status" checked={status} onChange={() => setStatus((prev) => !prev)}/>
                        <MultiSelect id="group-selector" isMulti placeholder="Groups" onChange={(Groups) => {setSelectedGroup(Groups)}} options={options}/>
                        <div className="h-px w-full bg-[#F2F1FE] my-[30px]"></div>
                        <Button className="flex gap-1 items-center px-3.5 py-2.5 bg-[#6B66F7] rounded text-white mt-[30px]" onClick={createPost}>
                            <Add />
                            Add Specification
                        </Button>
                    </SpecModal>
                </div>
            </div>
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
                                                        <button onClick={() => handleFetchSpec(row.id)} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-[#F5F5FE] hover:text-gray-900">Edit</button>
                                                        <SpecModal isOpen={modals.modal2} onRequestClose={() => closeModal('modal2')}>
                                                            <TextInput type="text" placeholder="Table Name" id="post-title" required value={title} onChange={(e) => {setTitle(e.target.value)}}/>
                                                            <Switch placeholder="Status" checked={status} onChange={() => setStatus((prev) => !prev)}/>
                                                            <MultiSelect id="edit-group-selector" isMulti placeholder="Groups" onChange={(Groups) => { setSelectedGroup(Groups)}} options={options} value={selectedGroup}/>
                                                            <div className="h-px w-full bg-[#F2F1FE] my-[30px]"></div>
                                                            <Button className="flex gap-1 items-center px-3.5 py-2.5 bg-[#6B66F7] rounded text-white" onClick={() => updatePost(row.id)}>
                                                                <Rotate />
                                                                Update Specification
                                                            </Button>
                                                        </SpecModal>
                                                        <button type="button" className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-[#F5F5FE] hover:text-gray-900" onClick={() => deletePost(row.id)}>
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
        </div>
    );
};

export default SpecTable;