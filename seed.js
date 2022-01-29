//seed.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const data = require('./components/starter.json');

prisma.collage.create({
    data: {
        src: data.src,
        values: data.values,
    },
})
.then(res => console.log(res))
