from matching.image_matcher import resolve_image_path


def test_resolves_different_image_extension(tmp_path):
    image = tmp_path / "lost_001.jpeg"
    image.touch()
    assert resolve_image_path({"original_image_url": str(image.with_suffix(".jpg"))}) == image.resolve()


def test_prefers_exact_reference(tmp_path):
    image = tmp_path / "lost_001.jpg"
    image.touch()
    image.with_suffix(".png").touch()
    assert resolve_image_path({"original_image_url": str(image)}) == image.resolve()


def test_does_not_guess_between_multiple_images(tmp_path):
    image = tmp_path / "lost_001.jpg"
    image.with_suffix(".png").touch()
    image.with_suffix(".jpeg").touch()
    assert resolve_image_path({"original_image_url": str(image)}) is None


def test_uses_blurred_image_when_original_is_missing(tmp_path):
    image = tmp_path / "lost_001_blurred.png"
    image.touch()
    assert resolve_image_path({
        "original_image_url": str(tmp_path / "missing.jpg"),
        "blurred_image_url": str(image.with_suffix(".jpg")),
    }) == image.resolve()
