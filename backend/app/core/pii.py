from presidio_analyzer import AnalyzerEngine, RecognizerRegistry
from presidio_analyzer.predefined_recognizers import FiPersonalIdentityCodeRecognizer

def create_pii_analyzer() -> AnalyzerEngine:
    """Create and configure the Presidio analyzer. Includes the official Finnish personal identity code recognizer."""
    # Create a custom registry to include the Finnish personal identity code recognizer 
    registry = RecognizerRegistry()
    registry.load_predefined_recognizers()

    # Enable the Finnish personal identity code recognizer
    registry.add_recognizer(FiPersonalIdentityCodeRecognizer())
    
    # Create the analyzer engine with the custom registry
    analyzer = AnalyzerEngine(
        registry=registry,
        supported_languages=["en", "fi"]
    )
    
    return analyzer