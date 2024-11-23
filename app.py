from fastapi import FastAPI, Request

app = FastAPI()

@app.post("/query")
async def query_endpoint(request: Request):
    data = await request.json()
    query = data.get("query", "")
    # Your logic here, e.g., retrieving from a RAG system
    response = {"answer": f"You asked: {query}"}
    return response
