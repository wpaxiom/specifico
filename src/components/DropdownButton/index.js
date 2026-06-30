import React, { useState, useEffect, useRef } from 'react';

const DropdownButton = ( {children} ) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const toggleDropdown = (e) => {
        e.stopPropagation();
        setIsOpen(prev => !prev);
    };

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div ref={containerRef} className="relative inline-block text-left">
            <button
                type="button"
                className="inline-flex items-center justify-center w-8 h-8 rounded-[9px] border-none bg-transparent hover:bg-[#EFEEFF] cursor-pointer transition-colors"
                onClick={toggleDropdown}
                aria-label="Row actions"
            >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="#B4B4C2">
                    <circle cx="9" cy="4" r="1.5"/>
                    <circle cx="9" cy="9" r="1.5"/>
                    <circle cx="9" cy="14" r="1.5"/>
                </svg>
            </button>

            {/* Dropdown panel */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="absolute right-0 z-20 w-[140px] mt-1 origin-top-right bg-white rounded-xl border border-[#EDEDF3] shadow-[0_10px_30px_-8px_rgba(30,28,80,0.28)] overflow-hidden text-left p-[5px]">
                    {children}
                </div>
            )}
        </div>
    );
};

export default DropdownButton;
