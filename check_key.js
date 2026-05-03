const key = 'AIzaSyC73_tLxSpI3UaId3_9mD0itBuObSfL-6c';
fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: "Hello" }] }] })
}).then(res => res.json()).then(console.log);
