import React from 'react';
import Modal from 'react-modal';

const SpecModal = ({ isOpen, onRequestClose, children, className, label }) => {

    const Styles = {
        content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            width: '690px',
            padding: '30px',
            overflow: 'initial',
        },
    };

    return (
        <Modal isOpen={isOpen} onRequestClose={onRequestClose} ariaHideApp={false} contentLabel={label} style={Styles}
           classNames={{
           control: (state) => {
               console.log(state);
           }
           }}
        >
            {children}

        </Modal>
    );
};

export default SpecModal;