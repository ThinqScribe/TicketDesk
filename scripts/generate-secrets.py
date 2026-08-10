#!/usr/bin/env python3
"""
Generate secure secrets for production deployment.
Run this script and copy the output to your .env.production file.
"""

import secrets
import string

def generate_secret_key(length=64):
    """Generate a cryptographically secure secret key."""
    return secrets.token_hex(length // 2)

def generate_password(length=24):
    """Generate a secure random password."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def main():
    print("=" * 70)
    print("🔐 TicketDesk Production Secrets Generator")
    print("=" * 70)
    print()
    print("Copy these values to your .env.production file:")
    print()
    print("-" * 70)
    print(f"SECRET_KEY={generate_secret_key()}")
    print()
    print("# Optional: Database password if you need to generate one")
    print(f"# DB_PASSWORD={generate_password()}")
    print()
    print("# Optional: Redis password if you need to generate one")
    print(f"# REDIS_PASSWORD={generate_password()}")
    print("-" * 70)
    print()
    print("⚠️  IMPORTANT:")
    print("  - Keep these secrets safe and never commit them to git")
    print("  - Use different secrets for each environment")
    print("  - Store secrets securely in your deployment platform")
    print()
    print("✅ Done! Add these to your hosting provider's environment variables.")
    print("=" * 70)

if __name__ == "__main__":
    main()
