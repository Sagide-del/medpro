import hashlib
import tempfile
import unittest
from contextlib import contextmanager
from pathlib import Path
from unittest.mock import patch
try:
    import app
except ImportError:
    app = None


@unittest.skipIf(app is None, 'Install the RAG service dependencies to test ingestion')
class IngestionTests(unittest.TestCase):
    def test_private_passages_preserve_pdf_pages_and_chapters_even_with_blank_pages(self):
        class Tokenizer:
            def encode(self, text, **_): return text.split()
            def decode(self, tokens, **_): return ' '.join(tokens)
        class Model:
            tokenizer = Tokenizer()
        class Page:
            def __init__(self, text): self.text = text
            def extract_text(self): return self.text
        class Bookmark:
            def __init__(self, title, page): self.title, self.page = title, page
        class Reader:
            pages = [Page('Cells are the structural and functional units of living organisms.'), Page(''), Page('Tissues contain groups of cells arranged to carry out specialised functions.')]
            outline = [Bookmark('Cells', 0), Bookmark('Tissues', 2)]
            is_encrypted = False
            def get_destination_page_number(self, entry): return entry.page
        inserts = []
        class DB:
            def execute(self, sql, values):
                if 'INSERT INTO rag_source_passages' in sql: inserts.append(values)
        @contextmanager
        def connect(): yield DB()
        class Store:
            def delete(self, **_): pass
            def upsert(self, **_): pass
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder); (root / 'sources').mkdir()
            data = b'%PDF-test-fixture'
            (root / 'sources' / 'fixture.pdf').write_bytes(data)
            document = dict(id='fixture', file_hash=hashlib.sha256(data).hexdigest(), filename='anatomy.pdf', source_type='textbook', program='Nursing', subject='Anatomy', version='1', scope_key='global')
            with patch.object(app, 'DATA', root), patch.object(app, 'PdfReader', return_value=Reader()), patch.object(app, 'model', return_value=Model()), patch.object(app, 'connect', connect), patch.object(app, 'collection', return_value=Store()), patch.object(app, 'embed', side_effect=lambda texts, _: [[1.0] for _ in texts]):
                pages, count = app.ingest(document)
            self.assertEqual((pages, count), (3, 2))
            self.assertEqual([row[2] for row in inserts], [1, 3])
            self.assertEqual([row[4] for row in inserts], ['Cells', 'Tissues'])
            self.assertTrue(all(row[0] == 'fixture' for row in inserts))

    def test_checksum_mismatch_stops_before_text_processing(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder); (root/'sources').mkdir(); (root/'sources'/'fixture.pdf').write_bytes(b'changed')
            with patch.object(app,'DATA',root):
                with self.assertRaisesRegex(ValueError,'checksum'):
                    app.ingest({'id':'fixture','file_hash':'incorrect'})
