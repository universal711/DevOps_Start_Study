echo "🧪 Testing application locally..."

cd app
npm start &
SERVER_PID=$!

sleep 5

echo "Testing endpoints..."
curl -f http://localhost:3000/health || exit 1
curl -f http://localhost:3000/ || exit 1
curl -f http://localhost:3000/stats || exit 1

kill $SERVER_PID
echo "✅ All tests passed!"
