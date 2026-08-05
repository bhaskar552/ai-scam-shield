"""
mock_stream.py — Synthetic Instant Payment Transaction Generator
Generates realistic FedNow/RTP transaction data:
  - 80% safe transactions (normal behavior)
  - 20% risky transactions (fraud indicators)
"""

import uuid
import random
from faker import Faker

fake = Faker()

SAFE_SENDER_NAMES = [
    "Alice Johnson", "Bob Martinez", "Carol White", "David Lee",
    "Emma Thompson", "Frank Garcia", "Grace Kim", "Henry Brown",
    "Isabella Davis", "James Wilson", "Karen Taylor", "Liam Anderson",
]

RISKY_SENDER_NAMES = [
    "Michael Chen", "Nancy Rodriguez", "Oliver Scott", "Patricia Hall",
    "Quentin Young", "Rachel Green", "Samuel Wright", "Tina Adams",
]


def generate_safe_transaction() -> dict:
    """Generate a normal, low-risk transaction (80% of stream)."""
    return {
        "transaction_id": str(uuid.uuid4()),
        "amount": round(random.uniform(10, 2000), 2),
        "sender_name": random.choice(SAFE_SENDER_NAMES),
        "sender_account_id": f"ACC-{random.randint(100000, 999999)}",
        "beneficiary_name": fake.name(),
        "beneficiary_bank": random.choice(["Chase", "BofA", "Wells Fargo", "Citi", "US Bank"]),
        "is_new_beneficiary": False,
        "velocity_1hr": random.randint(1, 3),
        "time_since_account_creation_days": random.randint(180, 1800),
        "transaction_type": random.choice(["P2P", "Bill Payment", "Business", "Payroll"]),
        "channel": random.choice(["Mobile App", "Web", "API"]),
    }


def generate_risky_transaction() -> dict:
    """Generate a suspicious, high-risk transaction (20% of stream)."""
    risk_profile = random.choice([
        "high_amount_new_bene",
        "high_velocity",
        "new_account_large",
        "combined_critical",
    ])

    base = {
        "transaction_id": str(uuid.uuid4()),
        "sender_name": random.choice(RISKY_SENDER_NAMES),
        "sender_account_id": f"ACC-{random.randint(100000, 999999)}",
        "beneficiary_name": fake.name(),
        "beneficiary_bank": random.choice(["Chime", "CashApp Bank", "Varo", "Unknown Routing"]),
        "transaction_type": random.choice(["P2P", "Wire", "Business"]),
        "channel": random.choice(["Mobile App", "API"]),
    }

    if risk_profile == "high_amount_new_bene":
        base.update({
            "amount": round(random.uniform(5000, 25000), 2),
            "is_new_beneficiary": True,
            "velocity_1hr": random.randint(1, 4),
            "time_since_account_creation_days": random.randint(90, 500),
        })
    elif risk_profile == "high_velocity":
        base.update({
            "amount": round(random.uniform(500, 5000), 2),
            "is_new_beneficiary": random.choice([True, False]),
            "velocity_1hr": random.randint(10, 25),
            "time_since_account_creation_days": random.randint(30, 300),
        })
    elif risk_profile == "new_account_large":
        base.update({
            "amount": round(random.uniform(3000, 15000), 2),
            "is_new_beneficiary": True,
            "velocity_1hr": random.randint(1, 6),
            "time_since_account_creation_days": random.randint(1, 14),
        })
    else:  # combined_critical — worst case
        base.update({
            "amount": round(random.uniform(15000, 50000), 2),
            "is_new_beneficiary": True,
            "velocity_1hr": random.randint(12, 25),
            "time_since_account_creation_days": random.randint(1, 7),
        })

    return base


def generate_transaction() -> dict:
    """Generate one transaction: 80% safe, 20% risky."""
    if random.random() < 0.80:
        return generate_safe_transaction()
    else:
        return generate_risky_transaction()
