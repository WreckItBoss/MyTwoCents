const { generateDebateByArticleID } = require('../services/debate/debate.js');
const WebSocket = require('ws');

function webSocket(server){

    const wss = new WebSocket.Server({server});
    wss.on('connection', (ws) => {
        console.log('new client connected');
        ws.send(JSON.stringify({type: "connected", data: {message: "WebSocket is now connected"}}));

        ws.on('message', async (packet) => {
            let onEvent;
            onEvent = (event) => {
                ws.send(JSON.stringify(event));
            }
            const content = JSON.parse(packet.toString());
            const data = content.data;
            if (content.type == "initiate_debate"){
                await generateDebateByArticleID(data.articleId, {numRounds: data.numRounds, teamSize: data.teamSize, userPosition: data.userPosition, onEvent});
            }

        })

        ws.on("close", () => {
            console.log("Client Disconnected")
        });
    });
}

module.exports = {webSocket};
