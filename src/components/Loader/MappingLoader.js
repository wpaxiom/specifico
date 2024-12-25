import React from 'react';

const MappingLoader = ({ count }) => {
    // Create an array of numbers from 1 to the specified count
    const numbers = Array.from({ length: count }, (_, index) => index + 1);

    return (
        <>
            {numbers.map(number => (
                <>
                    <div className="flex py-4 gap-5 border-t border-[#F2F1FE] items-center animate-pulse h-[69.6px]">
                        <div className="flex-initial w-1/3">
                            <div className="h-2 bg-[#ECEBFF] rounded w-full"></div>
                        </div>
                        <div className="flex-initial w-1/3">
                            <div className="h-2 bg-[#ECEBFF] rounded w-full"></div>
                        </div>
                        <div className="flex-initial w-1/3">
                            <div className="h-2 bg-[#ECEBFF] rounded w-full"></div>
                        </div>
                    </div>
                </>
            ))}
            <div className="flex py-4 gap-5 border-t border-[#F2F1FE] items-center animate-pulse h-[40px]">
                <div className="flex-initial w-32">
                    <div className="h-2 bg-[#ECEBFF] rounded w-full"></div>
                </div>
            </div>
        </>
    );
};

export default MappingLoader;
