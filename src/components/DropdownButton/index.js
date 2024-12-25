import React, { useState } from 'react';

const DropdownButton = ( {children} ) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative inline-block text-left">
            <button
                type="button"
                className=""
                onClick={toggleDropdown}
            >
                <svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M11.6784 4.16667C11.6784 3.25 10.9284 2.5 10.0117 2.5C9.09504 2.5 8.34504 3.25 8.34504 4.16667C8.34504 5.08333 9.09504 5.83333 10.0117 5.83333C10.9284 5.83333 11.6784 5.08333 11.6784 4.16667Z"
                        fill="#555555"/>
                    <path
                        d="M11.6784 15.8333C11.6784 14.9166 10.9284 14.1666 10.0117 14.1666C9.09504 14.1666 8.34504 14.9166 8.34504 15.8333C8.34504 16.75 9.09504 17.5 10.0117 17.5C10.9284 17.5 11.6784 16.75 11.6784 15.8333Z"
                        fill="#555555"/>
                    <path
                        d="M11.6784 10C11.6784 9.08337 10.9284 8.33337 10.0117 8.33337C9.09504 8.33337 8.34504 9.08337 8.34504 10C8.34504 10.9167 9.09504 11.6667 10.0117 11.6667C10.9284 11.6667 11.6784 10.9167 11.6784 10Z"
                        fill="#555555"/>
                </svg>

            </button>

            {/* Dropdown panel */}
            {isOpen && (
                <div
                    className="absolute right-0 z-10 w-56 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                    {children}
                </div>
            )}
        </div>
    );
};

export default DropdownButton;
