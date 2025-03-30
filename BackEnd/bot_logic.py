from agents import Agent, Runner, OpenAIChatCompletionsModel
from openai import AsyncAzureOpenAI
import asyncio
from openai.types.responses import ResponseTextDeltaEvent
import os
from dotenv import load_dotenv

load_dotenv()

async def generate_bot_response(user_input: str):
    """
    Generate a streaming response from the bot.
    
    Args:
        user_input: The user's message text
        
    Returns:
        An async generator that yields response chunks
    """
from agents import Agent, Runner, OpenAIChatCompletionsModel
from openai import AsyncAzureOpenAI
import asyncio
from openai.types.responses import ResponseTextDeltaEvent
import os
from dotenv import load_dotenv

load_dotenv()

from agents import Agent, Runner, OpenAIChatCompletionsModel
from openai import AsyncAzureOpenAI
import asyncio
from openai.types.responses import ResponseTextDeltaEvent
import os
from dotenv import load_dotenv

load_dotenv()

async def generate_bot_response(user_input: str):
    """
    Generate a streaming response from the bot.
    
    Args:
        user_input: The user's message text
        
    Returns:
        An async generator that yields response chunks
    """
    BASE_URL = os.getenv("AZURE_OPENAI_ENDPOINT")
    API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
    MODEL_NAME = os.getenv("AZURE_OPENAI_MODEL_NAME")
    VERSION = os.getenv("AZURE_OPENAI_API_VERSION")

    client = AsyncAzureOpenAI(azure_endpoint=BASE_URL, api_key=API_KEY, api_version=VERSION)

    try:
        agent = Agent(
            name="Assistant",
            instructions="A helpful assistant that provides information and assistance.",
            model=OpenAIChatCompletionsModel(model=MODEL_NAME, openai_client=client),
            tools=[]
        )

        result = Runner.run_streamed(agent, user_input)
        async for event in result.stream_events():
            if event.type == "raw_response_event" and isinstance(event.data, ResponseTextDeltaEvent):
                # Instead of printing, yield the response chunk
                yield event.data
    
    except Exception as e:
        await client.close()
        raise e
    finally:
        await client.close()

# Test function to run the generator and print results
async def test_generate_bot_response():
    async for chunk in generate_bot_response("write a 100 word story"):
        if hasattr(chunk, 'delta') and chunk.delta:
            print(chunk.delta, end="", flush=True)
    print()  # Add a newline at the end

# Run the test
if __name__ == "__main__":
    asyncio.run(test_generate_bot_response())
