from pydantic import BaseModel


class QueryRequest(BaseModel):
    question: str


class QueryResponse(BaseModel):
    sql: str
    data: list[dict]
    columns: list[str]
    chart_type: str
