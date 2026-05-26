import re

from sqlalchemy import create_engine, text, event
from langchain_community.utilities import SQLDatabase

MAX_ROWS = 1000
QUERY_TIMEOUT = 10  # 秒

engine = create_engine("sqlite:///:memory:", echo=False)


@event.listens_for(engine, "connect")
def _set_timeout(dbapi_conn, _):
    """每次连接时设置查询超时。"""
    dbapi_conn.execute(f"PRAGMA busy_timeout = {QUERY_TIMEOUT * 1000}")


FORBIDDEN_KEYWORDS = [
    "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE",
    "TRUNCATE", "REPLACE", "GRANT", "REVOKE", "EXEC", "EXECUTE",
    "ATTACH", "DETACH", "PRAGMA", "VACUUM", "REINDEX",
]

FORBIDDEN_PATTERN = re.compile(
    r'\b(' + '|'.join(FORBIDDEN_KEYWORDS) + r')\b',
    re.IGNORECASE,
)

MULTI_STATEMENT = re.compile(r';\s*\S')


def validate_sql(sql: str) -> str:
    """校验 SQL 安全性，自动追加 LIMIT。校验失败抛出 ValueError。"""
    stripped = sql.strip()

    if MULTI_STATEMENT.search(stripped):
        raise ValueError("禁止执行多条 SQL 语句")

    if FORBIDDEN_PATTERN.search(stripped):
        match = FORBIDDEN_PATTERN.search(stripped)
        raise ValueError(f"禁止的 SQL 操作: {match.group(0)}")

    if not re.match(r'\s*SELECT\b', stripped, re.IGNORECASE):
        raise ValueError("仅允许 SELECT 查询")

    if not re.search(r'\bLIMIT\b', stripped, re.IGNORECASE):
        sql = f"{stripped.rstrip(';')} LIMIT {MAX_ROWS}"

    return sql

SAMPLE_DATA_SQL = """
CREATE TABLE customers (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL
);

CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    order_date TEXT NOT NULL,
    total_amount REAL NOT NULL
);

CREATE TABLE order_items (
    id INTEGER PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL
);

INSERT INTO customers VALUES
(1, '张三', '北京', '2024-01-15'),
(2, '李四', '上海', '2024-02-20'),
(3, '王五', '广州', '2024-03-10'),
(4, '赵六', '深圳', '2024-03-15'),
(5, '陈七', '杭州', '2024-04-01'),
(6, '周八', '成都', '2024-04-10'),
(7, '吴九', '武汉', '2024-05-05'),
(8, '郑十', '南京', '2024-05-20'),
(9, '冯十一', '北京', '2024-06-01'),
(10, '钱十二', '上海', '2024-06-15');

INSERT INTO products VALUES
(1, 'iPhone 15', '电子产品', 5999.00),
(2, 'MacBook Pro', '电子产品', 14999.00),
(3, 'AirPods', '电子产品', 1299.00),
(4, '运动鞋', '服装', 599.00),
(5, 'T恤', '服装', 99.00),
(6, '牛仔裤', '服装', 299.00),
(7, '洗面奶', '日化', 79.00),
(8, '洗发水', '日化', 59.00),
(9, '瑜伽垫', '运动', 199.00),
(10, '蛋白粉', '运动', 299.00);

INSERT INTO orders VALUES
(1, 1, '2024-01-20', 7297.00),
(2, 2, '2024-02-25', 599.00),
(3, 3, '2024-03-15', 16298.00),
(4, 1, '2024-04-01', 1299.00),
(5, 4, '2024-04-15', 398.00),
(6, 5, '2024-05-10', 299.00),
(7, 6, '2024-05-20', 14999.00),
(8, 7, '2024-06-01', 138.00),
(9, 8, '2024-06-10', 599.00),
(10, 2, '2024-06-20', 7297.00),
(11, 9, '2024-07-01', 208.00),
(12, 10, '2024-07-15', 16298.00),
(13, 3, '2024-08-01', 599.00),
(14, 5, '2024-08-15', 5999.00),
(15, 6, '2024-09-01', 1299.00);

INSERT INTO order_items VALUES
(1, 1, 1, 1, 5999.00),
(2, 1, 3, 2, 1299.00),
(3, 2, 4, 1, 599.00),
(4, 3, 2, 1, 14999.00),
(5, 3, 3, 1, 1299.00),
(6, 4, 3, 1, 1299.00),
(7, 5, 5, 2, 99.00),
(8, 5, 6, 1, 299.00),
(9, 6, 10, 1, 299.00),
(10, 7, 2, 1, 14999.00),
(11, 8, 7, 1, 79.00),
(12, 8, 8, 1, 59.00),
(13, 9, 4, 1, 599.00),
(14, 10, 1, 1, 5999.00),
(15, 10, 3, 2, 1299.00),
(16, 11, 9, 1, 199.00),
(17, 12, 2, 1, 14999.00),
(18, 12, 3, 1, 1299.00),
(19, 13, 4, 1, 599.00),
(20, 14, 1, 1, 5999.00),
(21, 15, 3, 1, 1299.00);
"""


def _init_db():
    with engine.connect() as conn:
        for statement in SAMPLE_DATA_SQL.split(";"):
            stmt = statement.strip()
            if stmt:
                conn.execute(text(stmt))
        conn.commit()


_init_db()

# LangChain SQLDatabase: 负责 schema 自动提取
sql_db = SQLDatabase(engine=engine)
sql_db._sample_rows_in_table_info = 0  # 不输出 sample rows，避免干扰 LLM


def get_schema() -> str:
    return sql_db.get_table_info()


def execute_sql(sql: str) -> list[dict]:
    sql = validate_sql(sql)
    with engine.connect() as conn:
        conn.execute(text(f"PRAGMA query_timeout = {QUERY_TIMEOUT * 1000}"))
        result = conn.execute(text(sql))
        columns = list(result.keys())
        rows = [dict(zip(columns, row)) for row in result.fetchall()]
        return rows[:MAX_ROWS]
