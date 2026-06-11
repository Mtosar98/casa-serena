// api/create-preference.js

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    try {
        const { items } = req.body;

        if (!items || !items.length) {
            return res.status(400).json({ message: 'El carrito está vacío' });
        }

        // 🌟 Formateo ultra seguro: nos aseguramos de que el precio sea solo un número limpio
        const mpItems = items.map(item => {
            // Si el precio viene con puntos o signos (ej: "16.000"), lo limpiamos a número puro (16000)
            let cleanPrice = String(item.price).replace(/[^0-9]/g, '');
            if (!cleanPrice) cleanPrice = item.price; // Por si ya era un número puro

            return {
                title: item.name || 'Producto Casa Serena',
                unit_price: Number(cleanPrice),
                quantity: Number(item.quantity || 1),
                currency_id: 'ARS'
            };
        });

        const MP_ACCESS_TOKEN = "APP_USR-48317883-d78d-44d4-af94-34268b4b290f"; 

        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                items: mpItems,
                back_urls: {
                    success: `https://${req.headers.host}/index.html?status=success`,
                    failure: `https://${req.headers.host}/index.html?status=failure`,
                    pending: `https://${req.headers.host}/index.html?status=pending`
                },
                auto_return: 'approved'
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Error de Mercado Pago:', data);
            return res.status(500).json({ error: 'Error al conectar con Mercado Pago', details: data });
        }

        return res.status(200).json({ init_point: data.init_point });

    } catch (error) {
        console.error('Error del servidor:', error);
        return res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
}