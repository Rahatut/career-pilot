import asyncio
import uuid
from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI

from shared.auth import get_current_user
from shared.config import settings
from shared.db import get_db
from shared.models import ChatMessage, ChatSession

from .intent import classify_intent
from .rag import query_cv
from .tools import cover_letter, readiness_check, skill_gap

router = APIRouter(tags=["assistant"])


def _get_openai_client() -> AsyncOpenAI | None:
    if not settings.openai_api_key:
        return None
    return AsyncOpenAI(
        api_key=settings.openai_api_key,
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
    )


openai_client = _get_openai_client()


SYSTEM_PROMPT = """You are CareerPilot, an AI career assistant helping users with:
- Job search and recommendations
- CV/resume advice and analysis
- Skill gap identification
- Learning roadmaps and study plans
- Cover letter writing
- Interview preparation

Be helpful, specific, and actionable. Use provided CV context when relevant."""


def _get_or_create_session(db, user_id: str, session_id: str | None) -> ChatSession:
    if session_id:
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if session:
            return session

    # Create new session with auto-generated title
    new_session = ChatSession(id=uuid.uuid4(), user_id=user_id, title="New Chat")
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session


def _save_message(db, session_id: uuid.UUID, user_id: str, role: str, content: str):
    msg = ChatMessage(
        id=uuid.uuid4(),
        session_id=session_id,
        user_id=user_id,
        role=role,
        content=content,
    )
    db.add(msg)
    db.commit()


async def _build_messages(user_id: str, session: ChatSession, message: str) -> list[dict]:
    """Build the full message list including CV context and history."""
    messages: list[dict] = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Add CV context
    cv_context = await asyncio.to_thread(query_cv, current_user_id, message, n=5)
    if cv_context:
        messages.append({"role": "system", "content": f"User's CV context:\n{cv_context}"})

    # Add chat history (last 10)
    history = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.user_id == current_user_id,
            ChatMessage.session_id == session.id,
        )
        .order_by(ChatMessage.created_at.asc())
        .limit(10)
        .all()
    )
    for m in history:
        messages.append({"role": m.role, "content": m.content})

    messages.append({"role": "user", "content": message})
    return messages


@router.post("/chat", response_model=dict)
async def chat(
    payload: Annotated[dict, Body()],
    current_user_id: Annotated[str, Depends(get_current_user)],
    db=Depends(get_db),
):
    """Non-streaming chat endpoint."""
    message = payload.get("message", "")
    session_id: str | None = payload.get("session_id")
    jd_text = payload.get("jd_text", "")

    session = _get_or_create_session(db, current_user_id, session_id)
    intent = await classify_intent(message)

    # Save user message
    _save_message(db, session.id, current_user_id, "user", message)

    # Route based on intent first
    reply = ""
    if intent == "cover_letter" and jd_text:
        result = await asyncio.to_thread(cover_letter, current_user_id, jd_text)
        reply = result.get("cover_letter", result) if isinstance(result, dict) else str(result)
    elif intent == "skill_gap":
        target = payload.get("target_role", message)
        result = await asyncio.to_thread(skill_gap, current_user_id, target)
        reply = result.get("recommendations", str(result)) if isinstance(result, dict) else str(result)
    elif intent == "job_readiness" and jd_text:
        result = await asyncio.to_thread(readiness_check, current_user_id, jd_text)
        reply = result.get("notes", str(result)) if isinstance(result, dict) else str(result)
    else:
        # Use LLM
        messages = await _build_messages(current_user_id, session, message)
        try:
            if not openai_client:
                reply = "AI assistant is not configured. Please set OPENAI_API_KEY in .env to enable full functionality."
            else:
                response = await openai_client.chat.completions.create(
                    model="gemini-1.5-flash",
                    messages=messages,
                    max_tokens=800,
                    temperature=0.7,
                )
                reply = response.choices[0].message.content or "No response generated."
        except Exception as e:
            reply = f"Error: {e}"

    # Save assistant reply
    _save_message(db, session.id, current_user_id, "assistant", reply)

    return {
        "session_id": str(session.id),
        "intent": intent,
        "reply": reply,
    }


@router.post("/chat/stream")
async def chat_stream(
    payload: Annotated[dict, Body()],
    current_user_id: Annotated[str, Depends(get_current_user)],
    db=Depends(get_db),
):
    """Streaming chat endpoint."""
    message = payload.get("message", "")
    session_id: str | None = payload.get("session_id")

    session = _get_or_create_session(db, current_user_id, session_id)
    intent = await classify_intent(message)

    _save_message(db, session.id, current_user_id, "user", message)

    messages = await _build_messages(current_user_id, session, message)

    async def stream_gen() -> AsyncGenerator[str, None]:
        full_reply = ""
        try:
            if not openai_client:
                msg = "AI assistant is not configured. Please set OPENAI_API_KEY in .env to enable full functionality."
                yield msg
                full_reply = msg
            else:
                stream = await openai_client.chat.completions.create(
                    model="gemini-1.5-flash",
                    messages=messages,
                    stream=True,
                    max_tokens=800,
                    temperature=0.7,
                )
                async for chunk in stream:
                    token = chunk.choices[0].delta.content or ""
                    if token:
                        full_reply += token
                        yield token
        except Exception as e:
            yield f"Error: {e}"

        if full_reply:
            _save_message(db, session.id, current_user_id, "assistant", full_reply)

    return StreamingResponse(
        stream_gen(),
        media_type="text/plain",
        headers={"x-intent": intent, "x-session-id": str(session.id)},
    )


@router.get("/sessions", response_model=dict)
def list_sessions(
    current_user_id: Annotated[str, Depends(get_current_user)],
    db=Depends(get_db),
):
    """List all chat sessions for the user."""
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user_id)
        .order_by(ChatSession.updated_at.desc())
        .all()
    )
    return {
        "sessions": [
            {
                "session_id": str(s.id),
                "title": s.title,
                "updated_at": s.updated_at.isoformat() if s.updated_at else None,
            }
            for s in sessions
        ]
    }


@router.get("/sessions/{session_id}/messages", response_model=dict)
def get_session_messages(
    session_id: str,
    current_user_id: Annotated[str, Depends(get_current_user)],
    db=Depends(get_db),
):
    """Get all messages for a session."""
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user_id,
    ).first()
    if not session:
        raise HTTPException(404, "Session not found")

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return {
        "session_id": str(session.id),
        "title": session.title,
        "messages": [
            {"role": m.role, "content": m.content, "created_at": m.created_at.isoformat()}
            for m in messages
        ],
    }


@router.post("/cover-letter", response_model=dict)
async def cover_letter_endpoint(
    payload: Annotated[dict, Body()],
    current_user_id: Annotated[str, Depends(get_current_user)],
    db=Depends(get_db),
):
    jd_text = payload.get("jd_text", "")
    result = await asyncio.to_thread(cover_letter, current_user_id, jd_text)
    content = result.get("cover_letter", str(result)) if isinstance(result, dict) else str(result)
    return {"cover_letter": content}
