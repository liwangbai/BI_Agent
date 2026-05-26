import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.models import QueryRequest, QueryResponse, FeedbackRequest, DatabaseStatus
from app.database import get_schema, execute_sql, get_db_status
from app.llm import generate_sql
from app.memory import search_similar, get_memory_prompt, add_memory, list_all

app = FastAPI(title="Text-to-SQL BI Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/db/status", response_model=DatabaseStatus)
async def db_status():
    return get_db_status()


@app.post("/api/query", response_model=QueryResponse)
async def query(req: QueryRequest):
    schema = get_schema()
    memories = search_similar(req.question)
    memory_text = get_memory_prompt(memories)

    try:
        result = generate_sql(req.question, schema, memory_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM 调用失败: {str(e)}")

    sql = result["sql"]
    chart_type = result.get("chart_type", "table")

    try:
        data = execute_sql(sql)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SQL 执行失败: {str(e)}\n生成的 SQL:\n{sql}")

    columns = list(data[0].keys()) if data else []
    return QueryResponse(sql=sql, data=data, columns=columns, chart_type=chart_type)


@app.post("/api/feedback")
async def feedback(req: FeedbackRequest):
    mem_id = add_memory(req.question, req.sql, req.feedback, req.corrected_sql)
    return {"id": mem_id, "message": "反馈已记录"}


@app.get("/api/memories")
async def memories():
    return {"memories": list_all()}
