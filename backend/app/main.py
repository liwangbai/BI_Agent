import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.models import QueryRequest, QueryResponse
from app.database import get_schema, execute_sql
from app.llm import generate_sql

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


@app.post("/api/query", response_model=QueryResponse)
async def query(req: QueryRequest):
    schema = get_schema()
    try:
        result = generate_sql(req.question, schema)
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
