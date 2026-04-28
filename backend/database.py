"""
SQLite Veritabanı İşlemleri — Drive Evo Python Backend

Sürüş analizi sonuçlarını ve sigorta tekliflerini saklar.
Mevcut Prisma dev.db'den bağımsız, ayrı bir 'drive-evo_scores.db' dosyası kullanır.
"""
import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "drive-evo_scores.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Tabloları oluştur (yoksa)"""
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS drive_scores (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            drive_id    TEXT UNIQUE NOT NULL,
            user_id     TEXT,
            overall_score REAL NOT NULL,
            category_scores TEXT NOT NULL,   -- JSON
            risk_level  TEXT NOT NULL,
            risk_label  TEXT NOT NULL,
            created_at  TEXT NOT NULL
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS insurance_quotes (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            drive_id        TEXT NOT NULL,
            user_id         TEXT,
            overall_score   REAL NOT NULL,
            risk_level      TEXT NOT NULL,
            annual_premium  REAL NOT NULL,
            monthly_premium REAL NOT NULL,
            breakdown       TEXT NOT NULL,   -- JSON
            discount_message TEXT NOT NULL,
            vehicle_info    TEXT NOT NULL,   -- JSON
            created_at      TEXT NOT NULL,
            FOREIGN KEY (drive_id) REFERENCES drive_scores(drive_id)
        )
    """)

    conn.commit()
    conn.close()


def save_drive_score(drive_score, user_id: str | None = None):
    """Sürüş puanını kaydet"""
    conn = get_connection()
    try:
        conn.execute("""
            INSERT OR REPLACE INTO drive_scores
            (drive_id, user_id, overall_score, category_scores, risk_level, risk_label, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            drive_score.driveId,
            user_id,
            drive_score.overallScore,
            json.dumps(drive_score.categoryScores.model_dump()),
            drive_score.riskLevel,
            drive_score.riskLabel,
            datetime.utcnow().isoformat(),
        ))
        conn.commit()
    finally:
        conn.close()


def save_insurance_quote(quote, vehicle_info, user_id: str | None = None):
    """Sigorta teklifini kaydet"""
    conn = get_connection()
    try:
        conn.execute("""
            INSERT INTO insurance_quotes
            (drive_id, user_id, overall_score, risk_level, annual_premium, monthly_premium,
             breakdown, discount_message, vehicle_info, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            quote.driveId,
            user_id,
            quote.overallScore,
            quote.riskLevel,
            quote.annualPremium,
            quote.monthlyPremium,
            json.dumps(quote.breakdown.model_dump()),
            quote.discountMessage,
            json.dumps(vehicle_info.model_dump()),
            datetime.utcnow().isoformat(),
        ))
        conn.commit()
    finally:
        conn.close()


def get_drive_score(drive_id: str) -> dict | None:
    """Drive ID'ye göre puan getir"""
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM drive_scores WHERE drive_id = ?", (drive_id,)
        ).fetchone()
        if row:
            result = dict(row)
            result["category_scores"] = json.loads(result["category_scores"])
            return result
        return None
    finally:
        conn.close()


def get_user_history(user_id: str) -> list[dict]:
    """Kullanıcının sürüş geçmişini getir"""
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM drive_scores WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
            (user_id,)
        ).fetchall()
        result = []
        for row in rows:
            d = dict(row)
            d["category_scores"] = json.loads(d["category_scores"])
            result.append(d)
        return result
    finally:
        conn.close()


def get_latest_insurance_quote(drive_id: str) -> dict | None:
    """Drive ID'ye bağlı en son sigorta teklifini getir"""
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM insurance_quotes WHERE drive_id = ? ORDER BY created_at DESC LIMIT 1",
            (drive_id,)
        ).fetchone()
        if row:
            result = dict(row)
            result["breakdown"] = json.loads(result["breakdown"])
            result["vehicle_info"] = json.loads(result["vehicle_info"])
            return result
        return None
    finally:
        conn.close()
