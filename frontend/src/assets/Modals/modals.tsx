import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./modals.css";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode
}
const Modals: React.FC<ModalProps> =({isOpen, onClose, children})=>{
    if(!isOpen) return null;

    return(
        <div>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <button className="close-button" onClick={onClose}>✖</button>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modals