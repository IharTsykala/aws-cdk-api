/@ts-nocheck
import express from 'express'
import axios from 'axios'
import dotenv from 'dotenv'
import NodeCache from 'node-cache'

dotenv.config()
const app = express()
const port = process.env.PORT || 3000

const cache = new NodeCache({ stdTTL: 120 })

app.use(express.json())

app.get('/products', async (req: any, res: any) => {
    const cachedProducts: any = cache.get('products')

    if (cachedProducts) {
        console.log('Took products from cash')
        return res.json(cachedProducts)
    }

    try {
        const recipientURL: any = process.env['products']
        const response: any = await axios.get(`${recipientURL}/products`)
        const products: any = response.data

        cache.set('products', products, 120) // Cache for 2 minutes (120 seconds)
        console.log('Products was cashed')

        res.json(products)
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data)
        } else {
            res.status(500).json({ error: 'Internal Server Error' })
        }
    }
})

app.all('/:recipientServiceName', async (req: any, res: any) => {
    try {
        const recipientServiceName: any = req.params.recipientServiceName
        const recipientURL: any = process.env[recipientServiceName]

        if (!recipientURL) {
            return res.status(502).json({ error: 'Cannot process request' })
        }

        const method: any = req.method
        const url: any = `${recipientURL}${req.originalUrl}`
        const token = req.headers.authorization

        const response: any = await axios({
            method,
            url,
            ...(Object.keys(req.body || {}).length > 0 && { data: req.body }),
            headers: {
                authorization: token,
                'Content-Type': 'application/json',
            },
        })

        res.status(response.status).json(response.data)
    } catch (error: any) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data)
        } else {
            res.status(500).json({ error: 'Internal Server Error' })
        }
    }
})

app.listen(port, () => {
    console.log(`BFF Service is running on http://localhost:${port}`)
})
