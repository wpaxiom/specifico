import React from "react";

/**
 * Standalone progress card shown above the table while a bulk delete runs:
 * a spinning wheel, a "Deleting…" label, an "X of N deleted (NN%)" counter and
 * a filling progress bar.
 *
 * @param {Object} props
 * @param {number} props.done  Number of items deleted so far.
 * @param {number} props.total Total number of items being deleted.
 */
const DeleteProgress = ( { done, total } ) => {
    const percent = total ? Math.round( ( done / total ) * 100 ) : 0;

    return (
        <div className="bg-white border border-[#ECECF3] rounded-2xl shadow-[0_1px_2px_rgba(20,20,45,0.04),0_18px_40px_-24px_rgba(30,28,80,0.18)] px-[22px] py-4 mb-4">
            <div className="flex items-center justify-between gap-3.5 mb-[11px]">
                <div className="flex items-center gap-2.5">
                    <span className="w-[18px] h-[18px] rounded-full border-[2.5px] border-[#ECEBFF] border-t-[#6B66F7] inline-block animate-spin" />
                    <span className="font-extrabold text-[14px] text-[#23232E]">Deleting…</span>
                </div>
                <span className="font-bold text-[13px] text-[#6B66F7]">{done} of {total} deleted ({percent}%)</span>
            </div>
            <div className="h-2 rounded-full bg-[#ECEBFF] overflow-hidden">
                <div
                    className="h-full bg-[#6B66F7] rounded-full transition-all duration-200"
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
};

export default DeleteProgress;
