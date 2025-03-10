from fastapi import FastAPI
from fastapi import HTTPException
from pydantic import BaseModel
from llm import OpenAIService


app = FastAPI()
class PromptInput(BaseModel):
    prompt: str

@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}

@app.post("/generated")
def generate_text(input_data: PromptInput):
    generated_text = OpenAIService.generate_text(input_data.prompt)
    return {"generated_text": generated_text}