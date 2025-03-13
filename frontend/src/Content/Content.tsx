import React, { useState, useEffect } from "react";
import axios from "axios";
import Modals from "../assets/Modals/modals";
import Chat from "../ChatBox/Chat";
import { useLocation, useNavigate } from "react-router-dom";
const ContentPage = () => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const response = location.state?.response || "No response received";
    const responseAgent1 = location.state?.responseAgent1 || "No response received";
    const responseAgent2 = location.state?.responseAgent2 || "No response received";


    return (
        <div>
            <div>
                <h1>Content Page</h1>
                <p>{response}</p>
                <button onClick={() => setIsOpen(true)} className="button">PopUp</button>
            </div>
            <Modals isOpen={isOpen} onClose={() => setIsOpen(false)}>
                <Chat responseAgent1={responseAgent1} responseAgent2={responseAgent2} />
            </Modals>
        </div>
    );
};

export default ContentPage;
