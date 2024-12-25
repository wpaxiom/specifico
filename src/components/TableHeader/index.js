import React from "react";
import {flexRender} from "@tanstack/react-table";

const TableHeader = ({ table }) => {
    return (
        <div className="bg-[#F5F5FE] rounded-l rounded-r">
            {table.getHeaderGroups().map(headerGroup =>
                <div className="flex p-5 gap-5 font-medium text-[#333333] leading-none" key={headerGroup.id}>
                    {headerGroup.headers.map(header =>
                        <div
                            className={header.id === 'checkbox' ? 'flex-initial w-[4%] max-w-3.5' : 'flex-initial w-[24%]'}
                            key={header.id} colSpan={header.colSpan}>
                            {header.isPlaceholder ? null : (
                                <div>
                                    {flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                    )}
                                    {header.column.getCanFilter() ? (
                                        <div>
                                            {/*<Filter column={header.column} table={table} />*/}
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex-initial w-[24%] text-right">
                        Action
                    </div>
                </div>
            )}
        </div>
    );
}
export default TableHeader;