from rag_keywords import extract_matching_keywords

def test_keywords_found(tmp_path):
    doc = tmp_path / "doc.txt"
    doc.write_text("AI is a model trained on data using machine learning.")
    keywords = ["AI", "machine learning", "data", "model", "training"]
    result = extract_matching_keywords(str(doc), keywords)
    assert "AI" in result
    assert "machine learning" in result

def test_no_match(tmp_path):
    doc = tmp_path / "doc.txt"
    doc.write_text("Cats are fluffy.")
    keywords = ["AI", "data"]
    result = extract_matching_keywords(str(doc), keywords)
    assert "AI" not in result