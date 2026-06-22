const { llmChat } = require("../aiModel")

class DebateAgents{
    constructor(name, stance, persona){
        this.name = name;
        this.stance = stance;
        this.persona = persona;

        this.topic_opinion = None;
        this.article_opinion = None;
        this.latest_argument = None;
        this.messages = [
            {
                role: "system",
                content: persona,
            },
        ];
    }

    async generateTopicOpinion(topic){
        const prompt = renderPrompt("opinionGenerator.txt", {
            topic = this.topic,
            stance = this.stance
        });

        this.topic_opinion = await llmChat({
            messages: [
                { role: "system", content: this.persona},
                { role: "message", content: prompt}
            ]
        });

        return this.topic_opinion;
    }
    async generateArticleOpinion(topic, articleText){
        const prompt = renderPrompt("articleOpinionGenerator.txt",{
            topic,
            articleText,
            stance = this.stance
        });

        this.topic_opinion = await llmChat({
            messages: [
                {role: "system", content: this.persona},
                {role: "user", content: prompt}
            ]
        });

        return this.topic_opinion;
    }
    async generateRebuttal(topic, articleText){
        const prompt = renderPrompt("rebuttalGenerator.txt", 
            topic = this.topic,
            stance = this.stance,
            article_text = articleText,
            article_opinion = this.article_opinion,
            topic_opinion = this.topic_opinion
        );

        this.messages.push({role: "user", content: prompt});

        const response = await llmChat({messages: this.messages});

        this.latestArgument = response;
        return response;
    }
    observeMessage(speakerName, speakerStance, text){
        this.messages.push({
            role: "user",
            content: `${speakerName} (${speakerStance}) said:\n${text}`,
        });
    }
    
}