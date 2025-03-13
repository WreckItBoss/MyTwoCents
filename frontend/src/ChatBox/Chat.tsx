import React, {useState} from "react";
import axios from "axios";
import {useNavigate} from "react-router-dom";
import "./Chat.css"


interface ChatProps {
    responseAgent1: string;
    responseAgent2: string;
}

const Chat: React.FC<ChatProps> = ({ responseAgent1, responseAgent2 }) => {
    return (
        <div>
            <h2>Chatbot Responses</h2>
            <div className="chat-box">
                <p className="chatCardPro"><strong>Agent 1:</strong> {responseAgent1 || "Waiting for response..."}</p>
                <p className="chatCardAgainst"><strong>Agent 2:</strong> {responseAgent2 || "Waiting for response..."}</p>
            </div>
        </div>

    );
};

export default Chat;
