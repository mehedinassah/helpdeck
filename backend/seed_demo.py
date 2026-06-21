"""Seed (or re-seed) the Acme demo tenant with clean docs.

Usage:  python seed_demo.py <API_KEY>
Deletes the tenant's existing docs and re-adds the demo knowledge base.
"""
import sys
import requests

BASE = "http://localhost:8000"

DOCS = [
    ("Pricing",
     "Acme Cloud Storage plans start at $9/month for the Personal plan, which includes "
     "2TB of encrypted storage. The Team plan is $19 per user per month and includes 5TB "
     "of storage plus admin controls. All plans come with a 30-day money-back guarantee."),
    ("Storage & Security",
     "Every paid Acme plan includes end-to-end encrypted storage, automatic daily backups, "
     "and file sharing via expiring links. Data is encrypted both at rest and in transit. "
     "The Personal plan includes 2TB and the Team plan includes 5TB."),
    ("Refunds",
     "Acme offers a 30-day money-back guarantee on all plans. To request a refund, contact "
     "support and it will be processed within 5 business days to the original payment method."),
]


def main():
    if len(sys.argv) < 2:
        print("Usage: python seed_demo.py <API_KEY>")
        sys.exit(1)
    key = sys.argv[1]
    hdr = {"X-API-Key": key}

    existing = requests.get(f"{BASE}/api/documents", headers=hdr).json()
    for d in existing:
        requests.delete(f"{BASE}/api/documents/{d['id']}", headers=hdr)
        print("deleted old doc:", d["title"])

    for title, content in DOCS:
        r = requests.post(f"{BASE}/api/documents", headers=hdr, json={"title": title, "content": content})
        print("added:", title, r.status_code)

    print("\nDemo knowledge base re-seeded cleanly.")


if __name__ == "__main__":
    main()
