"""MP3 bytes to stdout; no scripts, credentials or service URLs in error logs."""
import asyncio,json,os,sys
import edge_tts
from edge_tts.communicate import _SSL_CTX

async def convert():
    data=json.load(sys.stdin)
    if os.environ.get('SSL_CERT_FILE'):
        _SSL_CTX.load_verify_locations(cafile=os.environ['SSL_CERT_FILE'])
    speech=edge_tts.Communicate(data['script'],data['voice'],rate='-8%',pitch='-2Hz',proxy=os.environ.get('HTTPS_PROXY') or os.environ.get('https_proxy'),connect_timeout=15,receive_timeout=60)
    size=0
    async for chunk in speech.stream():
        if chunk['type']=='audio':
            size+=len(chunk['data'])
            if size>12*1024*1024: raise ValueError('Audio too large')
            sys.stdout.buffer.write(chunk['data'])
            sys.stdout.buffer.flush()

try:
    asyncio.run(asyncio.wait_for(convert(),timeout=135))
except Exception:
    sys.stderr.write('Speech conversion failed.\n')
    sys.exit(1)
