const { Client } = require("voicevox-api-client")
const fs = require("fs/promises")
const express = require("express")
const crypto = require("crypto")
const path = require("path")
const app = express()
const axios = require("axios")
const j2e = require("json2emap")
app.listen(3000, () => console.log("ok"))

const client = new Client(`http://${process.env.VOICE_HOST || "localhost"}:50021`)

const apiEndpoint = `http://${process.env.VOICE_HOST || "localhost"}:50021`

const processingMap = new Map()
const waithingMap = new Map()

app.get("/speakers", async (req, res) => {
    const { data } = await axios.get(`${apiEndpoint}/speakers`)
    res.send(req.query.emap === "true" ? j2e(emap) : data)
})

app.get("/", async (req, res) => {
    const text = req.query.text
    const speakerId = req.query.speaker || 0
    let speed = Number(req.query.speed) || 1

    if(speed <= 0.1) speed = 1
    
    if(!text) {
        return res.sendFile(path.join(__dirname, `./fusei.wav`))
    }
    
    const hash = crypto.createHash('md5').update(speakerId + text + speed).digest('hex')
    
    if (await fileExists(`wav/${hash}`)) {
        return res.sendFile(path.join(__dirname, `./wav/${hash}`))
    }
    if (!processingMap.has(hash)) {
        processingMap.set(hash, true)
        await createVoice(text, hash, speakerId, speed)
        const waithing = waithingMap.get(hash)
        if(waithing) {
            waithing.forEach((wres) => wres.sendFile(path.join(__dirname, `./wav/${hash}`)))
            waithingMap.delete(hash)
        }
        processingMap.delete(hash)
        return res.sendFile(path.join(__dirname, `./wav/${hash}`))
    } else {
        if (waithingMap.has(hash)) {
            waithingMap.set(hash, [...waithingMap.get(hash), res])
        } else {
            waithingMap.set(hash, [res])
        }
    }
})

const createVoice = async (text, hash, speakerId, speed) => {
    console.log("cq")
    const query = await client.query.createQuery(speakerId, text)
    console.log("cv")
    const voice = await client.voice.createVoice(speakerId, {...query, speedScale: speed})
    console.log("cv ok")
    const buf = Buffer.from(voice)
    await fs.writeFile(`./wav/${hash}`, buf)
}


async function fileExists(filepath) {
    try {
        return !!(await fs.lstat(filepath))
    } catch (e) {
        return false
    }
}