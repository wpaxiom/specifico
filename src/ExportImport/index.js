import React from 'react';
import Logo from "../components/Icons/Logo";
import ExportCard from "../Settings/ExportCard";
import ImportCard from "../Settings/ImportCard";

const CARD = "bg-white border border-[#ECECF3] rounded-2xl shadow-[0_1px_2px_rgba(20,20,45,0.04),0_18px_40px_-24px_rgba(30,28,80,0.18)]";

// Standalone Export / Import admin page. Split out of Settings in the 1.0.x
// admin redesign so backups and migrations have a dedicated screen.
const ExportImport = () => {
    return (
        <div className="font-['Nunito'] text-sm mt-5 mr-5 relative text-[#54546A]">
            {/* page header card */}
            <div className={`${CARD} flex items-center gap-[15px] px-6 py-[18px] mb-5`}>
                <span className="w-10 [&_svg]:w-10 [&_svg]:h-auto block"><Logo /></span>
                <div>
                    <div className="font-extrabold text-[19px] text-[#23232E] tracking-[-0.2px]">Export &amp; Import</div>
                    <div className="font-medium text-[13px] text-[#9A9AAE] mt-0.5">Back up your specifications, or migrate them in from another plugin.</div>
                </div>
            </div>

            <div className="flex flex-col gap-5">
                <ExportCard />
                <ImportCard />
            </div>
        </div>
    );
};

export default ExportImport;
