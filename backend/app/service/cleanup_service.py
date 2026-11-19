from datetime import datetime, timedelta, timezone
from app.core.supabase_admin import get_admin_supabase_client


def get_file_path(url: str | None, bucket_name: str) -> str | None:
    # Extract the file path inside the bucket from the full Supabase URL
    if not url:
        return None
    marker = f"/{bucket_name}/"
    if marker in url:
        return url.split(marker, 1)[1].split("?")[0]
    return None


def cleanup_old_item_images():
    admin_supabase = get_admin_supabase_client()
    now = datetime.now(timezone.utc)

    # Define cutoff dates for 'open' and 'resolved' items
    open_cutoff = (now - timedelta(days=89)).isoformat()
    resolved_cutoff = (now - timedelta(days=29)).isoformat()

    # get open items older than 89 days (1 day before 90-day DB delete)
    old_open_items = (
        admin_supabase.table("items")
        .select("id, original_image_url, blurred_image_url")
        .eq("status", "open")
        .lte("created_at", open_cutoff)
        .execute()
    ).data or []

    # get resolved items older than 29 days (1 day before 30-day DB delete)
    old_resolved_items = (
        admin_supabase.table("items")
        .select("id, original_image_url, blurred_image_url")
        .eq("status", "resolved")
        .lte("updated_at", resolved_cutoff)
        .execute()
    ).data or []

    items_to_clean = old_open_items + old_resolved_items
    if not items_to_clean:
        return {"cleaned_items": 0}

    original_paths = []
    cleaned_paths = []
    item_ids = []

    for item in items_to_clean:
        item_ids.append(item["id"])

        orig_path = get_file_path(item.get("original_image_url"), "original_images")
        if orig_path:
            original_paths.append(orig_path)

        blur_path = get_file_path(item.get("blurred_image_url"), "cleaned_images")
        if blur_path:
            cleaned_paths.append(blur_path)

    # remove the images from Supabase storage
    if original_paths:
        admin_supabase.storage.from_("original_images").remove(original_paths)

    if cleaned_paths:
        admin_supabase.storage.from_("cleaned_images").remove(cleaned_paths)

    # clear the image URLs from the items in the database
    admin_supabase.table("items").update({
        "original_image_url": None,
        "blurred_image_url": None
    }).in_("id", item_ids).execute()

    return {
        "cleaned_items": len(item_ids),
        "deleted_original_images": len(original_paths),
        "deleted_cleaned_images": len(cleaned_paths)
    }