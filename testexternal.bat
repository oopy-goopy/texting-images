echo '{"room":"A1B2","user":"ExternalApp","text":"Hello from file"}' > payload.json
curl -v -X POST http://localhost:3000/api/send -H "Content-Type: application/json" -d @payload.json
