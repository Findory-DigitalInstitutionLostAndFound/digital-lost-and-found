from datetime import datetime


def parse_event_date(item):
    """Return the calendar date for event_timestamp, or None if unknown/invalid."""
    value = item.get("event_timestamp")
    if value is None or str(value).strip() == "":
        return None

    try:
        # Supports ISO dates, ISO datetimes, and timestamps ending in Z.
        return datetime.fromisoformat(str(value).strip().replace("Z", "+00:00")).date()
    except (TypeError, ValueError, OverflowError):
        return None


def is_chronologically_valid(lost_item, found_item):
    """Reject only when both dates are valid and the found date is before the lost date.

    If either date is missing or invalid, ordering is unknown rather than impossible.
    """
    lost_date = parse_event_date(lost_item)
    found_date = parse_event_date(found_item)

    if lost_date is None or found_date is None:
        return True

    return found_date >= lost_date


def days_between_valid_events(lost_item, found_item):
    """Return days between loss and discovery, or None if dates are unknown/impossible."""
    lost_date = parse_event_date(lost_item)
    found_date = parse_event_date(found_item)

    if lost_date is None or found_date is None or found_date < lost_date:
        return None

    return (found_date - lost_date).days
