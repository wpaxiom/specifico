import React from "react";

const TableFooter = ({ table, deletePosts }) => {
    return (
        <div className="flex border-t border-[#F2F1FE] px-5 py-3 w-full items-center">
            <div className="flex items-center flex-initial w-[50%] gap-2">
                <div className="flex gap-2 items-center">
                    <select className="border !border-[#E9E8FE]" value={table.getState().pagination.pageSize}
                            onChange={e => {
                                table.setPageSize(Number(e.target.value))
                            }}>
                        {[10, 20, 30, 40, 50].map(pageSize => (
                            <option key={pageSize} value={pageSize}>
                                Show {pageSize}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex">
                    <button className="px-2 py-[5px] bg-white rounded border border-[#E9E8FE]" type="button" onClick={() => deletePosts(table.getSelectedRowModel().rows.map(row => row.id))} disabled={! ( table.getIsAllRowsSelected() || table.getIsSomeRowsSelected() )}>
                        Bulk Delete
                    </button>
                </div>
            </div>
            <div className="flex flex-initial w-[50%] gap-3 items-center justify-end">
                <span>Page {table.getState().pagination.pageIndex + 1} of{' '} {table.getPageCount()}</span>
                <button onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
                    {'<<'}
                </button>
                <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                    {'<'}
                </button>
                <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                    {'>'}
                </button>
                <button onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                        disabled={!table.getCanNextPage()}>
                    {'>>'}
                </button>
            </div>
        </div>
    );
}
export default TableFooter;