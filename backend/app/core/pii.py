from presidio_analyzer import AnalyzerEngine, RecognizerRegistry
from presidio_analyzer.predefined_recognizers import FiPersonalIdentityCodeRecognizer

def create_pii_analyzer() -> AnalyzerEngine:
    """Create and configure the Presidio analyzer. Includes the official Finnish personal identity code recognizer."""
    # Create a custom registry to include the Finnish personal identity code recognizer 
    registry = RecognizerRegistry()
    registry.supported_languages = ["en", "fi"]  # Specify supported languages
    registry.load_predefined_recognizers(languages=["en", "fi"])  # Load predefined recognizers for English and Finnish

    # Enable the Finnish personal identity code recognizer
    registry.add_recognizer(FiPersonalIdentityCodeRecognizer())
    
    # Create the analyzer engine with the custom registry
    analyzer = AnalyzerEngine(
        registry=registry,
        supported_languages=["en", "fi"]
    )
    
    return analyzer