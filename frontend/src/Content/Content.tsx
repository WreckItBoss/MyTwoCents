import React, { useState, useEffect } from "react";
import axios from "axios";
import Modals from "../assets/Modals/modals";
import Chat from "../ChatBox/Chat";
import { useLocation, useNavigate } from "react-router-dom";

const ContentPage = () => {
    const location = useLocation();
    const response = location.state?.response || "No response received";

    return (
        <div>
            <h1>Content Page</h1>
            <p>{response}</p>
        </div>
    );
};

export default ContentPage;
