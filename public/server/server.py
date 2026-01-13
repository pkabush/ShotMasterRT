from flask import Flask, request, Response
import requests
from urllib.parse import unquote

app = Flask(__name__)

@app.route("/proxy/<path:url>", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
def proxy(url):
    if request.method == "OPTIONS":
        resp = Response()
        resp.headers["Access-Control-Allow-Origin"] = "*"
        resp.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,PATCH,OPTIONS"
        resp.headers["Access-Control-Allow-Headers"] = "*"
        return resp

    target_url = unquote(url)
    headers = {k: v for k, v in request.headers if k.lower() != "host"}

    r = requests.request(
        method=request.method,
        url=target_url,
        headers=headers,
        params=request.args,
        data=request.get_data() or None,
        stream=False  # get the fully decoded content automatically
    )

    # r.content is already decompressed if needed
    raw_content = r.content

    resp = Response(raw_content, status=r.status_code)

    # Copy headers except those that can break decoding
    for k, v in r.headers.items():
        if k.lower() not in ["content-encoding", "transfer-encoding", "content-length"]:
            resp.headers[k] = v

    # Add CORS headers
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,PATCH,OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "*"

    return resp

if __name__ == "__main__":
    app.run(port=4000)
