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
                <p><strong>Agent 1:</strong> {responseAgent1}</p>
                <p><strong>Agent 2:</strong> {responseAgent2}</p>
            </div>
        </div>

    );
    console.log("This is responseAgent1", responseAgent1);
    console.log("This is responseAgent2", responseAgent2);
};

export default Chat;
