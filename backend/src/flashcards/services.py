import random
import uuid
from datetime import datetime, timezone

from sqlmodel import Session, func, select

from .exceptions import EmptyCollectionError
from .models import Card, Collection, PracticeCard, PracticeSession
from .schemas import CardCreate, CardUpdate, CollectionCreate, CollectionUpdate


def get_collections(
    session: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> tuple[list[Collection], int]:
    count_statement = select(func.count()).where(Collection.user_id == user_id)
    count = session.exec(count_statement).one()
    statement = (
        select(Collection)
        .where(Collection.user_id == user_id)
        .order_by(Collection.updated_at.desc())
        .offset(skip)
        .limit(limit)
    )
    collections = session.exec(statement).all()
    return collections, count


def get_collection(
    session: Session, id: uuid.UUID, user_id: uuid.UUID
) -> Collection | None:
    statement = select(Collection).where(
        Collection.id == id, Collection.user_id == user_id
    )
    return session.exec(statement).first()


def create_collection(
    session: Session, collection_in: CollectionCreate, user_id: uuid.UUID
) -> Collection:
    collection = Collection.model_validate(collection_in, update={"user_id": user_id})
    collection.user_id = user_id
    session.add(collection)
    session.commit()
    session.refresh(collection)
    return collection


def update_collection(
    session: Session, collection: Collection, collection_in: CollectionUpdate
) -> Collection:
    collection_data = collection_in.model_dump(exclude_unset=True)
    for key, value in collection_data.items():
        setattr(collection, key, value)
    collection.updated_at = datetime.now(timezone.utc)
    session.add(collection)
    session.commit()
    session.refresh(collection)
    return collection


def delete_collection(session: Session, collection: Collection) -> None:
    session.delete(collection)
    session.commit()


def get_cards(
    session: Session, collection_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> tuple[list[Card], int]:
    count_statement = select(func.count()).where(Card.collection_id == collection_id)
    count = session.exec(count_statement).one()
    statement = (
        select(Card)
        .where(Card.collection_id == collection_id)
        .order_by(Card.updated_at.desc())
        .offset(skip)
        .limit(limit)
    )
    cards = session.exec(statement).all()
    return cards, count


def get_card(session: Session, card_id: uuid.UUID) -> Card | None:
    return session.get(Card, card_id)


def get_card_with_collection(
    session: Session, card_id: uuid.UUID, user_id: uuid.UUID
) -> Card | None:
    statement = (
        select(Card)
        .join(Collection)
        .where(Card.id == card_id, Collection.user_id == user_id)
    )
    return session.exec(statement).first()


def create_card(
    session: Session, collection_id: uuid.UUID, card_in: CardCreate
) -> Card:
    card = Card(collection_id=collection_id, **card_in.model_dump())
    session.add(card)
    session.commit()
    session.refresh(card)
    return card


def update_card(session: Session, card: Card, card_in: CardUpdate) -> Card:
    card_data = card_in.model_dump(exclude_unset=True)
    for key, value in card_data.items():
        setattr(card, key, value)
    card.updated_at = datetime.now(timezone.utc)
    session.add(card)
    session.commit()
    session.refresh(card)
    return card


def delete_card(session: Session, card: Card) -> None:
    session.delete(card)
    session.commit()


def check_collection_access(
    session: Session, collection_id: uuid.UUID, user_id: uuid.UUID
) -> bool:
    statement = select(Collection).where(
        Collection.id == collection_id, Collection.user_id == user_id
    )
    collection = session.exec(statement).first()
    return collection is not None


def get_practice_sessions(
    session: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> tuple[list["PracticeSession"], int]:
    count_statement = select(func.count()).where(PracticeSession.user_id == user_id)
    count = session.exec(count_statement).one()
    statement = (
        select(PracticeSession)
        .where(PracticeSession.user_id == user_id)
        .order_by(PracticeSession.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    practice_sessions = session.exec(statement).all()
    return practice_sessions, count


def get_practice_session(
    session: Session, session_id: uuid.UUID, user_id: uuid.UUID
) -> PracticeSession | None:
    statement = select(PracticeSession).where(
        PracticeSession.id == session_id, PracticeSession.user_id == user_id
    )
    return session.exec(statement).first()


def _get_uncompleted_session(
    session: Session, collection_id: uuid.UUID, user_id: uuid.UUID
) -> PracticeSession | None:
    statement = select(PracticeSession).where(
        PracticeSession.collection_id == collection_id,
        PracticeSession.user_id == user_id,
        PracticeSession.is_completed == False,  # noqa: E712
    )
    return session.exec(statement).first()


def _get_collection_cards(session: Session, collection_id: uuid.UUID) -> list[Card]:
    statement = select(Card).where(Card.collection_id == collection_id)
    return session.exec(statement).all()


def _create_practice_cards(
    session: Session, practice_session: PracticeSession, cards: list[Card]
) -> None:
    random_cards = random.sample(cards, len(cards))
    for card in random_cards:
        practice_card = PracticeCard(
            session_id=practice_session.id,
            card_id=card.id,
        )
        session.add(practice_card)


def create_practice_session(
    session: Session, collection_id: uuid.UUID, user_id: uuid.UUID
) -> PracticeSession:
    existing_session = _get_uncompleted_session(session, collection_id, user_id)
    if existing_session:
        session.delete(existing_session)
        session.commit()

    cards = _get_collection_cards(session, collection_id)
    if not cards:
        raise EmptyCollectionError(
            "Cannot create practice session for empty collection"
        )

    practice_session = PracticeSession(
        collection_id=collection_id,
        user_id=user_id,
        total_cards=len(cards),
    )
    session.add(practice_session)
    session.flush()  # Get practice_session.id without committing

    _create_practice_cards(session, practice_session, cards)

    session.commit()
    session.refresh(practice_session)
    return practice_session


def get_next_card(
    session: Session, practice_session_id: uuid.UUID
) -> tuple[Card, PracticeCard] | None:
    statement = (
        select(PracticeCard, Card)
        .join(Card, PracticeCard.card_id == Card.id)
        .where(
            PracticeCard.session_id == practice_session_id,
            PracticeCard.is_practiced == False,  # noqa: E712
        )
        .limit(1)
    )
    result = session.exec(statement).first()
    return result[1], result[0] if result else None


def get_practice_card(
    session: Session,
    practice_session_id: uuid.UUID,
    card_id: uuid.UUID,
) -> PracticeCard | None:
    statement = select(PracticeCard).where(
        PracticeCard.session_id == practice_session_id,
        PracticeCard.card_id == card_id,
    )
    return session.exec(statement).first()


def submit_card_result(
    session: Session,
    practice_card: PracticeCard,
    is_correct: bool,
) -> PracticeCard:
    practice_card.is_correct = is_correct
    practice_card.is_practiced = True
    practice_card.updated_at = datetime.now(timezone.utc)
    session.add(practice_card)

    practice_session = session.get(PracticeSession, practice_card.session_id)
    if practice_session:
        practice_session.cards_practiced += 1
        if is_correct:
            practice_session.correct_answers += 1

        if practice_session.cards_practiced == practice_session.total_cards:
            practice_session.is_completed = True

        practice_session.updated_at = datetime.now(timezone.utc)
        session.add(practice_session)

    session.commit()
    session.refresh(practice_card)
    return practice_card


def get_session_statistics(
    session: Session, practice_session_id: uuid.UUID
) -> PracticeSession:
    return session.get(PracticeSession, practice_session_id)


def get_card_by_id(session: Session, card_id: uuid.UUID) -> Card | None:
    statement = select(Card).where(Card.id == card_id)
    return session.exec(statement).first()
