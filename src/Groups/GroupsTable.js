/* global specificoAdminSettings */
import React, { useState, useEffect } from 'react';
import Api from "./../Utilites/Api";
import IndeterminateCheckbox from "../components/IndeterminateCheckbox";
import PostMetaRepeater from "../components/PostMetaRepeater";
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
import TextInput from "../components/TextInput";
import Logo from "../components/Icons/Logo"
import TableHeader from "../components/TableHeader";
import TableFooter from "../components/TableFooter";
import Check from "../components/Icons/Check";
import Rotate from "../components/Icons/Rotate";
import SpecLoader from "../components/Loader/SpecLoader";
import GroupLoader from "../components/Loader/GroupLoader";
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
        accessorKey: 'slug',
        header: 'Slug',
        cell: info => info.getValue(),
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

    const [ isLoading, setIsLoading ] = useState( false );

    const handleSaveAndClose = async () => {
        // Logic to save the meta fields to the specific post
        // Once saved, close the attribute section
        setShowAttributeSection(false);

        if ( isEditing ) {
            await updatePost( isEditing );
            setIsEditing( '' );
        } else {
            await createPost();
        }
    };

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
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading( true );
            const response = await Api.get('/specifico/v1/groups');
            setData(response.data);
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
            const response = await Api.post(
                '/specifico/v1/groups',
                {
                    title: title,
                    status: 'publish',
                    meta: {
                        _specifico_attr: attributes,
                    }
                }
            );
            setGroupCounts( parseInt( specificoAdminSettings.groups ) + 1 );
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
            const response = await Api.put(
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
        try {
            setIsLoading( true );
            await Promise.all(
                posts.map(async (postId) => {
                    await Api.delete(`/specifico/v1/groups/${postId}`);
                })
            );
            // After deleting all posts, fetch the updated list of posts
            fetchData();
        } catch (error) {
            console.error('Error deleting groups:', error);
        } finally {
            setIsLoading( false );
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

    return (
        <div className="font-['Nunito'] text-sm mt-5 mr-5 relative">
            <div>
                <div className="flex bg-white drop-shadow-[0_0_4px_rgba(26,26,26,0.15)] px-5 py-4 mb-5 items-center rounded">
                    <div className="flex flex-auto gap-3 items-center">
                        <Logo/>
                        <div>
                            <h1 className="text-lg font-semibold text-[#333333]">Specification Groups</h1>
                            <p className="text-[#555555]">Here are your groups tables. You can edit or delete them.</p>
                        </div>
                    </div>
                    <div className="flex-initial text-right">
                        { showAttributeSection &&
                            <button className="flex gap-1 items-center px-3.5 py-2.5 bg-[#6B66F7] rounded text-white" onClick={handleSaveAndClose}>
                                { isEditing &&
                                    <>
                                        <Rotate />
                                        Update Group
                                    </>
                                }
                                { ! isEditing &&
                                    <>
                                        Save Group
                                    </>
                                }
                            </button>
                        }

                        { ! showAttributeSection &&
                            <button onClick={() => setShowAttributeSection(true)}
                                    className="flex gap-1 items-center px-3.5 py-2.5 bg-[#6B66F7] rounded text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 3.333v9.334M3.333 8h9.334"/></svg>
                                Add Group
                            </button>
                        }

                    </div>
                </div>
                {!showAttributeSection && (
                    <div className="bg-white drop-shadow-[0_0_4px_rgba(26,26,26,0.15)] rounded">
                        { groupCounts > 0 &&
                            <>
                                <TableHeader table={table} />
                                <div>
                                    { ! isLoading &&
                                        table.getRowModel().rows.map(row =>
                                            <div className="flex px-5 py-4 gap-5 border-t border-[#F2F1FE] items-center"
                                                 key={row.id}>
                                                {row.getVisibleCells().map(cell =>
                                                    <div
                                                        className={cell.id.includes('checkbox') ? 'flex-initial w-[4%] max-w-3.5 text-[#555555]' : 'flex-initial w-[24%] text-[#555555]'}
                                                        key={cell.id}> {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </div>
                                                )}
                                                <div className="flex-initial w-[24%] text-[#555555] text-right">
                                                    <DropdownButton>
                                                        <button onClick={() => fetchGroup(row.id)} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-[#F5F5FE] hover:text-gray-900">Edit</button>
                                                        <button type="button"
                                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-[#F5F5FE] hover:text-gray-900"
                                                                onClick={() => deletePost(row.id)}>
                                                            Delete
                                                        </button>
                                                    </DropdownButton>
                                                </div>

                                            </div>
                                        )
                                    }

                                    { isLoading &&
                                        <GroupLoader count={specificoAdminSettings.groups} />
                                    }
                                </div>
                                <TableFooter table={table} deletePosts={deletePosts} />
                            </>
                        }
                        { groupCounts <= 0 &&
                            <EmptySection title="Group not found" desc="Sorry ! No specification group found. You can add group by clicking add group button" />
                        }
                    </div>
                )}
            </div>

            {showAttributeSection && (
                <div>
                    <div className="bg-white drop-shadow-[0_0_4px_rgba(26,26,26,0.15)] mb-5 items-center rounded">
                        <h2 className="bg-[#F5F5FE] px-5 py-4 text-[15px] font-semibold rounded-tl rounded-tr">
                            Attribute Name
                        </h2>
                        <div className="px-5 py-3.5">
                            <TextInput type="text" placeholder="Enter Group Name" id="post-title" required value={title} onChange={(e) => {setTitle(e.target.value)}}/>
                        </div>
                    </div>

                    <div className="bg-white drop-shadow-[0_0_4px_rgba(26,26,26,0.15)] mb-5 items-center rounded">
                        <div className="bg-[#F5F5FE] px-5 py-4 text-[15px] font-semibold rounded-tl rounded-tr flex flex-auto">
                            <div className="w-1/4">Attribute Type</div>
                            <div className="w-1/4">Attribute Value</div>
                            <div className="w-2/4">Values</div>
                        </div>
                        <div className="pb-5 px-5">
                            <PostMetaRepeater
                                metaFields={attributes}
                                onAddField={handleAddField}
                                onChange={handleChange}
                                onRemoveField={handleRemoveField}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupsTable;