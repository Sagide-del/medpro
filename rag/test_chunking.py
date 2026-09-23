import unittest
from chunking import chunk_record, page_chunks, prefixed


class Tokenizer:
    def encode(self, text, **_):
        return text.split()

    def decode(self, tokens, **_):
        return " ".join(tokens)


class ChunkTests(unittest.TestCase):
    def test_prefixes(self):
        self.assertEqual(prefixed(["airway"], "passage"), ["passage: airway"])
        self.assertEqual(prefixed(["airway"], "query"), ["query: airway"])
        with self.assertRaises(ValueError):
            prefixed(["airway"], "unknown")

    def test_no_lost_words_and_bounded_chunks(self):
        text = " ".join(f"word{n}" for n in range(1000))
        chunks = list(page_chunks(text, Tokenizer()))
        self.assertTrue(all(len(chunk.split()) <= 350 for chunk in chunks))
        self.assertEqual(set(text.split()), set(" ".join(chunks).split()))
        self.assertEqual(chunks[0].split()[-60:], chunks[1].split()[:60])

    def test_identity_keeps_page_and_scope(self):
        doc = dict(id="doc", filename="chapter.pdf", source_type="textbook", program="EMT", subject="Airway", version="1", scope_key="global")
        one, metadata = chunk_record(doc, 1, 0, "Evidence")
        two, _ = chunk_record(doc, 2, 0, "Evidence")
        self.assertNotEqual(one, two)
        self.assertEqual(metadata["page_number"], 1)
        self.assertEqual(metadata["certification_level"], "EMT")


if __name__ == "__main__":
    unittest.main()
