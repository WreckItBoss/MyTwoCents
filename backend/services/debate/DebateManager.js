const { generateArticleOpinion, generateTopicOpinion, generateRebuttal, observeMessage } = require("../debate");
const DebateAgent = require("./DebateAgent");

class DebateManager{
    constructor({topic, articleText, agentConfig, numRounds = 3}){
        this.topic = topic;
        this.article = articleText;
        this.agentConfig = agentConfig;
        this.numRounds = numRounds;

        this.agents = [];
        this.debateHistory = [];
    }

    async initializeAgents(    ){
        this.agents = this.agentConfig((config) => {
            return new DebateAgent({
                name: config.name,
                stance: config.stance,
                persona: config.persona
                
            });
        });
    }
    
    async initializeOpinions(){
        for(const agent of this.agents){
            await agent.generateTopicOpinion(this.topic);
            await agent.generateArticleOpinion(this.topic, this.article);
        }
    }
    async runDebate(){
        this.initializeAgents();
        await this.initializeOpinions();
        for(let rounds = 0; rounds < this.numRounds; rounds++){
            await runRounds(rounds);
        }
        return this.debateHistory;
    }

}

A