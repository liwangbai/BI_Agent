from fastapi import FastAPI

app = FastAPI(title="Text-to-SQL BI Agent")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
