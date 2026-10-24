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
        class Cursor:
            def __enter__(self): return self
            def __exit__(self, *_): pass
            def executemany(self, sql, values): inserts.extend(values)
        class DB:
            def cursor(self): return Cursor()
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
            with patch.object(app, 'DATA', root), patch.object(app, 'PdfReader', return_value=Reader()), patch.object(app, 'model', return_value=Model()), patch.object(app, 'connect', connect), patch.object(app, 'collection', return_value=Store()), patch.object(app, 'embed', side_effect=lambda texts, _: [[1.0] for _ in texts]) as encoded:
                progress=[]
                pages, count = app.ingest(document, progress=lambda *values: progress.append(values))
            self.assertEqual(encoded.call_count,1,'Passages on different pages should share one embedding batch')
            self.assertEqual((pages, count), (3, 2))
            self.assertIn(('loading_model',3,0,0),progress)
            self.assertEqual(progress[-1],('embedding',3,3,2))
            self.assertEqual([row[2] for row in inserts], [1, 3])
            self.assertEqual([row[4] for row in inserts], ['Cells', 'Tissues'])
            self.assertTrue(all(row[0] == 'fixture' for row in inserts))

    def test_checksum_mismatch_stops_before_text_processing(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder); (root/'sources').mkdir(); (root/'sources'/'fixture.pdf').write_bytes(b'changed')
            with patch.object(app,'DATA',root):
                with self.assertRaisesRegex(ValueError,'checksum'):
                    app.ingest({'id':'fixture','file_hash':'incorrect'})

    def test_cross_page_batches_are_bounded_and_keep_all_passages(self):
        class Tokenizer:
            def encode(self, text, **_): return text.split()
            def decode(self, tokens, **_): return ' '.join(tokens)
        class Model:
            tokenizer = Tokenizer()
        class Page:
            def extract_text(self): return 'Source evidence for safe clinical revision and assessment of the patient.'
        class Reader:
            pages = [Page() for _ in range(65)]
            outline = []
            is_encrypted = False
        inserted, batches, progress = [], [], []
        connections = []
        class Cursor:
            def __enter__(self): return self
            def __exit__(self, *_): pass
            def executemany(self, _sql, values): inserted.extend(values)
        class DB:
            def execute(self, *_): pass
            def cursor(self): return Cursor()
        @contextmanager
        def connect():
            connections.append(1)
            yield DB()
        class Store:
            def delete(self, **_): pass
            def upsert(self, **values): batches.append(len(values['documents']))
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder); (root/'sources').mkdir(); data=b'%PDF-batch-fixture'
            (root/'sources'/'fixture.pdf').write_bytes(data)
            document=dict(id='fixture',file_hash=hashlib.sha256(data).hexdigest(),filename='clinical.pdf',source_type='textbook',program='Paramedic',subject='Airway',version='1',scope_key='global')
            with patch.object(app,'DATA',root), patch.object(app,'PdfReader',return_value=Reader()), patch.object(app,'model',return_value=Model()), patch.object(app,'connect',connect), patch.object(app,'collection',return_value=Store()), patch.object(app,'embed',side_effect=lambda texts,_:[[1.0] for _ in texts]):
                self.assertEqual(app.ingest(document,progress=lambda *value:progress.append(value)),(65,65))
        self.assertEqual(batches,[32,32,1])
        self.assertEqual(len(connections),4,'One initial cleanup plus one database connection per full passage batch')
        self.assertEqual([row[2] for row in inserted],list(range(1,66)))
        self.assertEqual(len({row[1] for row in inserted}),65)
        self.assertEqual(progress[-1],('embedding',65,65,65))
