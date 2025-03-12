import openai
import os
from dotenv import load_dotenv
from typing import Optional

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    raise ValueError("Missing OpenAI API key. Set OPENAI_API_KEY in .env")

class OpenAIService:
    def __init__(self, api_key: str = api_key, model: str = "gpt-4"):
        self.client = openai.OpenAI(api_key=api_key)
        self.model = model

    #Agent with a supportive stance below 
    def agent1(self, prompt: str, max_tokens: Optional[int] = 150) -> str:
        try:
            response = self.client.chat.completions.create( 
                model=self.model,
                messages=[
                    {"role": "system", "content": f"You're stance is supportive about the topic {prompt}."},
                    {"role": "user", "content": f"Generate me your opinion about {prompt}"},

                ],
                max_tokens=max_tokens,
                temperature=0.7,
            )
            print(prompt) 
            return response.choices[0].message.content.strip()
        except Exception as e:
            return f"Error: {str(e)}"
        
    #Agent with an opposing stance below 
    def agent2(self, prompt: str, max_tokens: Optional[int] = 150) -> str:
        try:
            response = self.client.chat.completions.create( 
                model=self.model,
                messages=[
                    {"role": "system", "content": f"You're stance is against about the topic {prompt}."},
                    {"role": "user", "content": f"Generate me your opinion about {prompt}"},

                ],
                max_tokens=max_tokens,
                temperature=0.7,
            )
            print(prompt) 
            return response.choices[0].message.content.strip()
        except Exception as e:
            return f"Error: {str(e)}"
    
    #Just creating a text about the subject
    def generate_text(self, prompt: str, max_tokens: Optional[int] = 150) -> str:
        try:
            response = self.client.chat.completions.create( 
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a writer."},
                    {"role": "user", "content": f"Generate me text about {prompt}"},

                ],
                max_tokens=max_tokens,
                temperature=0.7,
            )
            print(prompt) 
            return response.choices[0].message.content.strip()
        except Exception as e:
            return f"Error: {str(e)}"
