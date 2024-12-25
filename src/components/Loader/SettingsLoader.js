import React from 'react';
import Switch from "../Switch";
import MultiSelect from "../MultiSelect";

const SettingsLoader = () => {

    return (
        <>
            <div className="px-5 pb-5">
                <div className="flex gap-7 py-6 relative before:content-'' before:w-full before:h-px before:bg-dash-border before:bg-repeat-x before:absolute before:bottom-0">
                    <div className="flex-initial w-[20%]">
                        <div className="h-2 bg-[#ECEBFF] rounded w-full"></div>
                    </div>
                    <div className="flex-initial w-[80%]">
                        <div className="h-2 bg-[#ECEBFF] rounded w-full"></div>
                    </div>
                </div>
                <div className="flex gap-7 py-6 relative before:content-'' before:w-full before:h-px before:bg-dash-border before:bg-repeat-x before:absolute before:bottom-0">
                    <div className="flex-initial w-[20%]">
                        <div className="h-2 bg-[#ECEBFF] rounded w-full"></div>
                    </div>
                    <div className="flex-initial w-[80%]">
                        <div className="h-2 bg-[#ECEBFF] rounded w-full"></div>
                    </div>
                </div>
                <div className="flex-initial pt-5 w-32">
                    <div className="h-2 bg-[#ECEBFF] rounded w-full"></div>
                </div>
            </div>
        </>
    );
};

export default SettingsLoader;
