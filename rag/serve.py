"""Serve on IPv4 and IPv6, including Railway private IPv6 hostnames."""
import socket


def create_listener(port=8010):
    if socket.has_dualstack_ipv6():
        return socket.create_server(("::", port), family=socket.AF_INET6, dualstack_ipv6=True)
    return socket.create_server(("0.0.0.0", port))


def main():
    import uvicorn
    with create_listener() as listener:
        server = uvicorn.Server(uvicorn.Config("app:app", workers=1))
        server.run(sockets=[listener])


if __name__ == "__main__":
    main()
