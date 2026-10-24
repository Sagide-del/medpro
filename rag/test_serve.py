import socket
import unittest
from serve import create_listener


class ListenerTests(unittest.TestCase):
    def test_ipv4_and_private_ipv6_connect_to_same_listener(self):
        with create_listener(0) as listener:
            port = listener.getsockname()[1]
            for host in (["127.0.0.1", "::1"] if socket.has_dualstack_ipv6() else ["127.0.0.1"]):
                with socket.create_connection((host, port), timeout=2) as client:
                    with listener.accept()[0] as peer:
                        client.sendall(b"connected")
                        self.assertEqual(peer.recv(9), b"connected")
