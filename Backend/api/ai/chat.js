app.post('/api/ai/chat', async (req, res) => {

    try {

        const reply = await AIService.generate(
            req.body.messages,
            req.body.provedor
        );

        res.json({
            reply,
            model: 'llama-3.3-70b-versatile'
        });

    } catch (error) {
        res.status(500).json({
            error: error.message
        });

    }

});