import React from 'react';

const GroupLoader = ({ count }) => {
    // Create an array of numbers from 1 to the specified count
    const numbers = Array.from({ length: count }, (_, index) => index + 1);

    return (
        <>
            {numbers.map(number => (
                <>
                    <div className="flex px-5 py-4 gap-5 border-t border-[#F2F1FE] items-center animate-pulse h-[58.4px]">
                        <div className="flex-initial w-[5%] max-w-3.5">
                            <div className="h-4 bg-[#ECEBFF] rounded w-4"></div>
                        </div>
                        <div className="flex-initial w-[19%]">
                            <div className="h-2 bg-[#ECEBFF] rounded w-32"></div>
                        </div>
                        <div className="flex-initial w-[19%]">
                            <div className="h-2 bg-[#ECEBFF] rounded w-32"></div>
                        </div>
                        <div className="flex-initial w-[19%]">
                            <div className="h-2 bg-[#ECEBFF] rounded w-14"></div>
                        </div>
                        <div className="flex-initial w-[19%]">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="h-2 bg-[#ECEBFF] rounded col-span-1"></div>
                                <div className="h-2 bg-[#ECEBFF] rounded col-span-1"></div>
                                <div className="h-2 bg-[#ECEBFF] rounded col-span-1"></div>
                            </div>
                        </div>
                        <div className="flex-initial w-[19%] text-right">
                            <div className="relative inline-block text-left">
                                <div className="h-2 bg-[#ECEBFF] rounded w-8"></div>
                            </div>
                        </div>
                    </div>
                </>
            ))}
        </>
    );
};

export default GroupLoader;