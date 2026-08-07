import logging

import resend

from core.config import settings

resend.api_key = settings.RESEND_API_KEY

logger = logging.getLogger(__name__)


def _send(payload: dict) -> None:
    """
    Thin wrapper around resend.Emails.send that absorbs delivery errors.
    Email failures are logged but never propagated — a failed email must
    never cause a request to return 500.
    """
    try:
        resend.Emails.send(payload)
    except Exception as exc:  # noqa: BLE001
        logger.error("Email delivery failed to %s: %s", payload.get("to"), exc)


def send_verification_email(to_email: str, token: str) -> None:
    verify_link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    _send({
        "from": settings.RESEND_FROM_EMAIL,
        "to": [to_email],
        "subject": "Verify your TicketDesk email",
        "html": f"""
            <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
                <h2>Verify your email</h2>
                <p>Thanks for signing up for TicketDesk. Click the button below to verify your email address.</p>
                <a href="{verify_link}"
                   style="display:inline-block; padding:12px 20px; background:#0f3460; color:white;
                          text-decoration:none; border-radius:6px; margin-top:12px;">
                    Verify Email
                </a>
                <p style="color:#888; font-size:12px; margin-top:24px;">
                    This link expires in 24 hours. If you didn't create this account, you can ignore this email.
                </p>
            </div>
        """,
    })


def send_password_reset_email(to_email: str, token: str) -> None:
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    _send({
        "from": settings.RESEND_FROM_EMAIL,
        "to": [to_email],
        "subject": "Reset your TicketDesk password",
        "html": f"""
            <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
                <h2>Reset your password</h2>
                <p>We received a request to reset your password. Click the button below to choose a new one.</p>
                <a href="{reset_link}"
                   style="display:inline-block; padding:12px 20px; background:#0f3460; color:white;
                          text-decoration:none; border-radius:6px; margin-top:12px;">
                    Reset Password
                </a>
                <p style="color:#888; font-size:12px; margin-top:24px;">
                    This link expires in 30 minutes. If you didn't request a reset, you can ignore this email.
                </p>
            </div>
        """,
    })


def send_invite_email(
    to_email: str,
    invited_by: str,
    company_name: str,
    temporary_password: str,
) -> None:
    login_link = f"{settings.FRONTEND_URL}/login"
    _send({
        "from": settings.RESEND_FROM_EMAIL,
        "to": [to_email],
        "subject": f"You've been invited to join {company_name} on TicketDesk",
        "html": f"""
            <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
                <h2>You're invited!</h2>
                <p><strong>{invited_by}</strong> has invited you to join <strong>{company_name}</strong> on TicketDesk.</p>
                <p>Use the credentials below to log in:</p>
                <div style="background:#f4f4f4; padding:12px; border-radius:6px; margin:16px 0;">
                    <p style="margin:0;"><strong>Email:</strong> {to_email}</p>
                    <p style="margin:8px 0 0;"><strong>Temporary password:</strong> {temporary_password}</p>
                </div>
                <a href="{login_link}"
                   style="display:inline-block; padding:12px 20px; background:#0f3460; color:white;
                          text-decoration:none; border-radius:6px; margin-top:12px;">
                    Log In to TicketDesk
                </a>
                <p style="color:#888; font-size:12px; margin-top:24px;">
                    Please change your password after your first login.
                </p>
            </div>
        """,
    })
