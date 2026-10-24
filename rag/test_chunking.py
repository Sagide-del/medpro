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


class ChapterTests(unittest.TestCase):
    def test_bookmarks_are_ordered_and_opening_pages_are_retained(self):
        from chunking import chapter_starts, chapter_for_page
        class Bookmark:
            def __init__(self, title, page): self.title, self.page = title, page
        class Reader:
            pages = [None] * 20
            outline = [Bookmark('Cells', 2), [Bookmark('Tissues', 8)]]
            def get_destination_page_number(self, entry): return entry.page
        starts = chapter_starts(Reader())
        self.assertEqual(starts, [(1, 'Opening pages'), (3, 'Cells'), (9, 'Tissues')])
        self.assertEqual(chapter_for_page(starts, 5), 'Cells')
        self.assertEqual(chapter_for_page(starts, 15), 'Tissues')

    def test_a_book_without_bookmarks_has_an_honest_fallback(self):
        from chunking import chapter_starts
        class Reader:
            pages = [None] * 3
            outline = []
        self.assertEqual(chapter_starts(Reader()), [(1, 'Book content (no PDF chapter bookmarks)')])
