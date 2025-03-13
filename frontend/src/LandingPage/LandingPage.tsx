import React, { useState, useEffect } from "react";
import axios from "axios";
import "./LandingPage.css";
import Modals from "../assets/Modals/modals";
import Chat from "../ChatBox/Chat";

const LandingPage: React.FC = () => {
    const [userInput, setUserInput] = useState<string>("");
    const [isOpen, setIsOpen] = useState(false);
    const [response, setResponse] = useState<string>("");
    const [responseAgent1, setResponseAgent1] = useState<string>("");
    const [responseAgent2, setResponseAgent2] = useState<string>("");

    const handleSubmit = async () => {
        try {
            const { data } = await axios.post("http://127.0.0.1:8000/process-text", { text: userInput });
            setResponse(data.processed_text);
        } catch (error) {
            console.error("Error sending data:", error);
        }
    };

    const sendAgent1 = async () => {
        try {
            const { data } = await axios.post("http://127.0.0.1:8000/agent1", { text: userInput });
            setResponseAgent1(data.processed_text); 
        } catch (error) {
            console.error("Error sending data to Agent1:", error);
        }
    };

    const sendAgent2 = async () => {
        try {
            const { data } = await axios.post("http://127.0.0.1:8000/agent2", { text: userInput });
            setResponseAgent2(data.processed_text);
        } catch (error) {
            console.error("Error sending data to Agent2:", error);
        }
    };

    useEffect(() => {
        console.log("Updated responseAgent1:", responseAgent1);
    }, [responseAgent1]);

    useEffect(() => {
        console.log("Updated responseAgent2:", responseAgent2);
    }, [responseAgent2]);

    return (
        <div>
            <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="What do you want to know...."
                rows={5}
                cols={40}
                style={{ resize: "none", padding: "10px", fontSize: "16px" }}
            />
            <button onClick={async () => { await handleSubmit(); await sendAgent1(); await sendAgent2(); }} className="button">Click here</button>
            <button onClick={() => setIsOpen(true)} className="button">PopUp</button>

            <Modals isOpen={isOpen} onClose={() => setIsOpen(false)}>
                <p>Hello</p>
                <Chat responseAgent1={responseAgent1} responseAgent2={responseAgent2} />
            </Modals>

            <p><strong>Response:</strong> {response}</p>
        </div>
    );
};

export default LandingPage;
