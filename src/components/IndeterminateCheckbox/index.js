import React from "react";
import Checkbox from "../Checkbox";
function IndeterminateCheckbox({ indeterminate, className = "", ...rest }) {
    const ref = React.useRef(null)

    React.useEffect(() => {
        if (typeof indeterminate === "boolean") {
            ref.current.indeterminate = !rest.checked && indeterminate
        }
    }, [ref, indeterminate])

    return (
        <input
            type="checkbox"
            ref={ref}
            className={ className + " peer relative appearance-none shrink-0 w-4 h-4 !border-2 !border-[#C3C1FB] !bg-transparent rounded-sm ring-inset focus:ring-2 focus:ring-[#C3C1FB] checked:focus:ring-0 checked:before:!w-4 checked:before:!h-4 checked:before:!m-0 checked:before:!content-checked indeterminate:before:!w-4 indeterminate:before:!h-4 indeterminate:before:!m-0  indeterminate:before:!content-partial-checked checked:!border-0 indeterminate:!border-0 focus:!border-0 checked:!shadow-none focus:!shadow-none"}
            {...rest}
        />
    )
}

export default IndeterminateCheckbox;