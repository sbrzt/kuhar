#!/bin/bash

PORT=8000

echo "Starting local server at http://localhost:$PORT"
python3 -m http.server "$PORT" &

SERVER_PID=$!

if command -v xdg-open > /dev/null; then
    xdg-open "http://localhost:$PORT"
elif command -v open > /dev/null; then
    open "http://localhost:$PORT"
else
    echo "Please open http://localhost:$PORT manually in your browser"
fi

trap "kill $SERVER_PID" EXIT
wait $SERVER_PID
