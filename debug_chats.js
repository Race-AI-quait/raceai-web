
const { dataService } = require('./lib/data-service');
// Mock the environment variables since we are running in node
process.env.NEXT_PUBLIC_BACKEND_URL = 'http://localhost:5001';
process.env.NEXT_PUBLIC_USE_MOCK_DB = 'false';

// We need to polyfill fetch for Node environment if using older node, but usually recent node has it.
// raceai-web likely has node modules installed.

async function checkChats() {
    try {
        console.log("Fetching chats via dataService...");
        // This runs the EXACT code that /api/chats/route.ts runs (minus the NextRequest wrapper)
        const chats = await dataService.getChats();

        console.log("Found chats:", chats.length);
        if (chats.length > 0) {
            const firstChat = chats[0];
            console.log("First Chat Messages:");
            firstChat.messages.forEach(m => {
                console.log(`- Role: ${m.role}, Sender: ${m.sender}, Content: ${m.content.substring(0, 20)}...`);
            });
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

checkChats();
