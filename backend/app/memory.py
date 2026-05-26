import sqlite3
import hashlib
import os
import threading
from datetime import datetime
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

MEMORY_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "memories.db")
SIMILARITY_THRESHOLD = 0.3
MAX_MEMORIES = 3

_vectorizer = TfidfVectorizer(analyzer="char_wb", ngram_range=(1, 3))
_lock = threading.Lock()


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(MEMORY_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _init_db():
    with _get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS memories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                question TEXT NOT NULL,
                sql TEXT NOT NULL,
                feedback TEXT NOT NULL,
                corrected_sql TEXT DEFAULT '',
                scope TEXT DEFAULT 'schema',
                schema_hash TEXT DEFAULT '',
                created_at TEXT NOT NULL
            )
        """)


_init_db()


def add_memory(question: str, sql: str, feedback: str, corrected_sql: str = "") -> int:
    scope = "schema" if corrected_sql else "global"
    with _get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO memories (question, sql, feedback, corrected_sql, scope, schema_hash, created_at) "
            "VALUES (?, ?, ?, ?, ?, '', ?)",
            (question, sql, feedback, corrected_sql, scope, datetime.now().isoformat()),
        )
        conn.commit()
        return cur.lastrowid


def search_similar(question: str, top_k: int = MAX_MEMORIES) -> list[dict]:
    with _get_conn() as conn:
        rows = conn.execute("SELECT id, question, sql, feedback, corrected_sql FROM memories ORDER BY id DESC LIMIT 200").fetchall()
    if not rows:
        return []

    questions = [row["question"] for row in rows]
    with _lock:
        try:
            tfidf_matrix = _vectorizer.fit_transform(questions + [question])
        except ValueError:
            return []

    target_vec = tfidf_matrix[-1:]
    corpus_vec = tfidf_matrix[:-1]
    similarities = cosine_similarity(target_vec, corpus_vec).flatten()

    results = []
    for i, sim in enumerate(similarities):
        if sim >= SIMILARITY_THRESHOLD:
            results.append({
                "question": rows[i]["question"],
                "sql": rows[i]["sql"],
                "feedback": rows[i]["feedback"],
                "corrected_sql": rows[i]["corrected_sql"],
                "similarity": round(float(sim), 3),
            })

    results.sort(key=lambda x: x["similarity"], reverse=True)
    return results[:top_k]


def get_memory_prompt(memories: list[dict]) -> str:
    if not memories:
        return ""

    lines = [
        "\n\n## 历史经验（请参考以下过往修正，避免重复错误）\n",
    ]
    for i, m in enumerate(memories, 1):
        lines.append(f"### 案例 {i}")
        lines.append(f"用户问题: {m['question']}")
        lines.append(f"错误 SQL: {m['sql']}")
        lines.append(f"用户反馈: {m['feedback']}")
        if m["corrected_sql"]:
            lines.append(f"正确 SQL: {m['corrected_sql']}")
        lines.append("")
    return "\n".join(lines)


def list_all() -> list[dict]:
    with _get_conn() as conn:
        rows = conn.execute("SELECT id, question, sql, feedback, corrected_sql, scope, created_at FROM memories ORDER BY id DESC LIMIT 50").fetchall()
        return [dict(row) for row in rows]
