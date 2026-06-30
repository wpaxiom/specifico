import React from "react";

// Search box for the server-paginated admin tables. Controlled by the parent;
// the parent debounces the value before issuing the REST request. The optional
// result count is shown on the right of the toolbar row.
const TableSearch = ( { value, onChange, placeholder = "Search…", count, noun } ) => {
    return (
        <div className="flex items-center justify-between gap-4 px-[22px] pt-[18px] pb-4">
            <div className="relative w-[330px] max-w-full">
                <span className="absolute left-[14px] top-1/2 -translate-y-1/2 flex pointer-events-none">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="7" cy="7" r="5" stroke="#9A9AAE" strokeWidth="1.6"/>
                        <line x1="11" y1="11" x2="14.6" y2="14.6" stroke="#9A9AAE" strokeWidth="1.6" strokeLinecap="round"/>
                    </svg>
                </span>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    aria-label="Search"
                    className="w-full !h-[38px] !min-h-[38px] box-border !border-none !rounded-[10px] !pl-[38px] !pr-[14px] !py-0 !m-0 leading-[38px] font-medium !text-[14px] !text-[#3A3A45] !bg-[#F5F5F9] placeholder:!text-[#9A9AAE] !outline-none focus:!bg-white focus:!shadow-[0_0_0_3px_rgba(107,102,247,0.18)] focus:!ring-0"
                />
            </div>
            { count != null && (
                <span className="flex-none font-semibold text-[12.5px] text-[#A2A2B4]">
                    { Number( count ).toLocaleString() } { noun }
                </span>
            ) }
        </div>
    );
};

export default TableSearch;
