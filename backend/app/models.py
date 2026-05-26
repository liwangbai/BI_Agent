from pydantic import BaseModel


class QueryRequest(BaseModel):
    question: str


class QueryResponse(BaseModel):
    sql: str
    data: list[dict]
    columns: list[str]
    chart_type: str


class FeedbackRequest(BaseModel):
    question: str
    sql: str
    feedback: str
    corrected_sql: str = ""


class DatabaseStatus(BaseModel):
    db_type: str
    tables: list[str]
    table_count: int
