import React from "react";

const TableFooter = ({ table, deletePosts, totalRows }) => {
    const { pageIndex, pageSize } = table.getState().pagination;
    const total = totalRows ?? table.getRowModel().rows.length;
    const start = total === 0 ? 0 : pageIndex * pageSize + 1;
    const end = Math.min((pageIndex + 1) * pageSize, total);
    const pageCount = table.getPageCount() || 1;
    const hasSelection = table.getIsAllPageRowsSelected() || table.getIsSomePageRowsSelected();

    const caret = (
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5 6 7.5 9 4.5" stroke="#888" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );

    return (
        <div className="flex items-center justify-between gap-4 px-[22px] py-4 bg-[#FAFAFC] border-t border-[#EFEFF4]">
            {/* left: page size + bulk delete */}
            <div className="flex items-center gap-3.5">
                <div className="inline-flex items-center gap-2 h-9 pl-[13px] pr-[5px] bg-white border border-[#E7E7EF] rounded-[10px] font-semibold text-[13px] text-[#54546A]">
                    Rows
                    <span className="relative inline-flex items-center gap-1.5 pl-[9px] pr-7 py-1 bg-[#F2F2F7] rounded-[7px] font-bold text-[#3A3A45]">
                        {pageSize}
                        <span className="pointer-events-none absolute right-[9px] top-1/2 -translate-y-1/2">{caret}</span>
                        <select
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            value={pageSize}
                            onChange={e => table.setPageSize(Number(e.target.value))}
                            aria-label="Rows per page"
                        >
                            {[10, 25, 50, 100, 200, 500].map(size => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => deletePosts(table.getSelectedRowModel().rows.map(row => row.id))}
                    disabled={!hasSelection}
                    className="h-9 px-3.5 bg-transparent border-none rounded-[9px] font-bold text-[13px] text-[#DC2626] hover:bg-[#FEF2F2] disabled:text-[#C9A0A0] disabled:bg-transparent disabled:cursor-not-allowed transition-colors"
                >
                    Bulk delete
                </button>
            </div>

            {/* right: count + pager */}
            <div className="flex items-center gap-3.5">
                <span className="font-semibold text-[13px] text-[#9A9AAE]">
                    <b className="text-[#54546A]">{start}–{end}</b> of {Number(total).toLocaleString()}
                </span>
                <div className="inline-flex items-center bg-white border border-[#E7E7EF] rounded-[10px] overflow-hidden">
                    <button
                        type="button"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="inline-flex items-center justify-center w-9 h-9 bg-white hover:bg-[#F5F5F9] disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Previous page"
                    >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M8 3 5 6.5 8 10" stroke="#777" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <span className="inline-flex items-center gap-1.5 px-3 h-9 border-l border-r border-[#EFEFF4] font-semibold text-[13px] text-[#54546A]">
                        Page
                        <input
                            type="number"
                            min={1}
                            max={pageCount}
                            value={pageIndex + 1}
                            onChange={e => {
                                const page = e.target.value ? Number(e.target.value) - 1 : 0;
                                const last = Math.max(table.getPageCount() - 1, 0);
                                table.setPageIndex(Math.min(Math.max(page, 0), last));
                            }}
                            aria-label="Go to page"
                            className="!w-[34px] !h-6 !min-h-0 text-center !border-none !rounded-md !bg-[#F2F2F7] !px-0 !py-0 !m-0 font-bold !text-[13px] !text-[#3A3A45] !outline-none focus:!ring-0 focus:!shadow-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        / {pageCount}
                    </span>
                    <button
                        type="button"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="inline-flex items-center justify-center w-9 h-9 bg-white hover:bg-[#F5F5F9] disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Next page"
                    >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M5 3 8 6.5 5 10" stroke="#777" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
export default TableFooter;
