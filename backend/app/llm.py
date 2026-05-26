import os
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

llm = ChatOpenAI(
    model=os.getenv("OPENAI_MODEL", "deepseek-chat"),
    api_key=os.getenv("OPENAI_API_KEY", ""),
    base_url=os.getenv("OPENAI_BASE_URL", "https://api.deepseek.com"),
    temperature=0.1,
)

SYSTEM_TEMPLATE = """你是一个 SQL 专家。根据数据库的表结构和用户的自然语言问题，生成正确的 SQL 查询语句。

要求：
1. 只生成 SELECT 语句，禁止 INSERT/UPDATE/DELETE/DROP 等写操作
2. 使用标准 SQL 语法（SQLite 兼容）
3. 根据查询结果的类型，建议最合适的图表类型：bar（柱状图）、line（折线图）、pie（饼图）、table（表格）
   - 比较类数据用 bar
   - 趋势/时间序列用 line
   - 占比/比例用 pie
   - 明细列表用 table
   - 当查询包含多个量纲差异很大的指标时（如同时查价格和销量），必须用 table
4. 严格按 JSON 格式返回，不要包含任何其他文字：
{{"sql": "SELECT ...", "chart_type": "bar"}}

当前数据库表结构：
{schema}"""

prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_TEMPLATE),
    ("user", "{question}"),
])

parser = JsonOutputParser()
chain = prompt | llm | parser


def generate_sql(question: str, schema: str) -> dict:
    result = chain.invoke({"question": question, "schema": schema})
    return result
