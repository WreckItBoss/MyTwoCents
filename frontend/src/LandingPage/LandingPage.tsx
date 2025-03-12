import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

const LandingPage: React.FC =()=>{
    const [userInput, setUserInput] = useState<string>("");
    const [response, setResponse] = useState<string>("");
    const handleSubmit = async() =>{
        try {
            const {data} = await axios.post("http://127.0.0.1:8000/process-text", {text:userInput});
            setResponse(data.processed_text)
        } catch (error) {
            console.error("Error sending data:", error);
        }
    }
    return (
        <div>
        <textarea
            value = {userInput}
            onChange = {(e) => setUserInput(e.target.value)}
            placeholder="What do you want to know...."
            rows = {5}
            cols={40}
            style={{ resize: "none", padding: "10px", fontSize: "16px" }}
        />
        <button onClick={handleSubmit} className="button"> Click here </button>
        <button onClick={handleSubmit} className="button"> PopUp </button>
        <p><strong>Response:</strong> {response}</p>
        </div>
    );
};

export default LandingPage