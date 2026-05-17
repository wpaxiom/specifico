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
                    <button className="px-3 py-[12px] bg-white rounded border border-[#E9E8FE] text-[#555555] leading-none disabled:opacity-50 disabled:cursor-not-allowed" type="button" onClick={() => deletePosts(table.getSelectedRowModel().rows.map(row => row.id))} disabled={! ( table.getIsAllRowsSelected() || table.getIsSomeRowsSelected() )}>
                        Bulk Delete
                    </button>
                </div>
            </div>
            <div className="flex flex-initial w-[50%] gap-4 items-center justify-end">
                {(() => {
                    const { pageIndex, pageSize } = table.getState().pagination;
                    const total = table.getFilteredRowModel().rows.length;
                    const start = total === 0 ? 0 : pageIndex * pageSize + 1;
                    const end = Math.min((pageIndex + 1) * pageSize, total);
                    return <span className="text-[#555555]">{start}-{end} of {total}</span>;
                })()}
                <button
                    type="button"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="text-[#555555] disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Previous page"
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="text-[#555555] disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Next page"
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
            </div>
        </div>
    );
}
export default TableFooter;