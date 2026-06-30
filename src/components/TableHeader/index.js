import React from "react";
import { flexRender } from "@tanstack/react-table";

// Grid table header. `template` is the CSS grid-template-columns string shared
// with the body rows so header and cells stay aligned. The trailing (action)
// column header is intentionally blank.
const TableHeader = ({ table, template }) => {
    const headerGroup = table.getHeaderGroups()[0];

    return (
        <div
            className="grid items-center px-[22px] pb-[11px] border-b border-[#EFEFF4] font-bold text-[10.5px] tracking-[0.09em] uppercase text-[#A2A2B4]"
            style={{ gridTemplateColumns: template }}
        >
            {headerGroup.headers.map(header => (
                <span key={header.id}>
                    {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                </span>
            ))}
            <span />
        </div>
    );
}
export default TableHeader;
