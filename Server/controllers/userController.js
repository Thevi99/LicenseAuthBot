const License = require('../models/licenseModel');
const Auth = require('../models/authModel');
const crypto = require('crypto');

const Cooldown = 1000 * 60 * 60 * 24 * 1; // 7 days

const key = Buffer.from('648d9439a3b189fb8d4c5fa784d67f18f5e514c097faac15e7c1f6b2cc9e17e0', 'hex');
const iv = Buffer.from('a592e47ab84ad06369c9d929', 'hex');

function xorStrings(str1) {
    let str2 = 'secretlilbro'
    let result = '';
    for (let i = 0; i < str1.length; i++) {
        result += String.fromCharCode(str1.charCodeAt(i) ^ str2.charCodeAt(i % str2.length));
    }
    return result;
}

let get_hwid = function (requestHeaders) {
    console.log("Received headers:", requestHeaders);
    let headers = ["valyse-fingerprint", "sirhurt-fingerprint", "sw-fingerprint", "bark-fingerprint", "delta-fingerprint", "comet-fingerprint", "evon-fingerprint", "trigon-fingerprint", "oxy-fingerprint", "wrd-fingerprint", "flux-fingerprint", "syn-fingerprint", "krnl-hwid", "sentinel-fingerprint", "electronid", "seriality-identifier", "hydrogen-fingerprint", "codex-fingerprint", "krampus-fingerprint", "vegax-fingerprint", "arceus-fingerprint"];
    let headerExecutors = {
        "syn-fingerprint": "Synapse X",
        "sw-fingerprint": "Script-Ware",
        "krnl-hwid": "KRNL",
        "electronid": "Electron",
        "trigon-fingerprint": "Trigon",
        "sirhurt-fingerprint": "SirHurt",
        "bark-fingerprint": "Bark",
        "delta-fingerprint": "Delta",
        "comet-fingerprint": "Comet",
        "evon-fingerprint": "Evon",
        "oxy-fingerprint": "Oxygen U",
        "wrd-fingerprint": "WeAreDevs",
        "flux-fingerprint": "Fluxus",
        "sentinel-fingerprint": "Sentinel",
        "valyse-fingerprint": "Valyse",
        "seriality-identifier": "Seriality",
        "hydrogen-fingerprint": "Hydrogen",
        "codex-fingerprint": "Code X",
        "krampus-fingerprint": "Krampus",
        "vegax-fingerprint": "Vega X",
        "arceus-fingerprint": "Arceus"
    };
    let executorName = "Unknown HWID"
    let hwid = "";
    let totalHeaders = 0;
    for (let i = 0; i < headers.length; i++) {
        if (requestHeaders[headers[i]]) {
            totalHeaders++;
            executorName = headerExecutors[headers[i]];
            hwid = requestHeaders[headers[i]];
        }
    }
    if (hwid == "") {
        // console log all the headers
        console.log(requestHeaders);
        return { success: false, data: "No hwid found" };
    }
    if (totalHeaders > 1) {
        return { success: false, data: "Multiple hwids found" };
    }
    return { success: true, data: hwid, executor: executorName };
}

function encrypt(data) {
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encryptedData = cipher.update(data, 'utf8', 'hex');
    encryptedData += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');
    return { encryptedData, tag };
}

function decrypt(encryptedData, tag) {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    let decryptedData = decipher.update(encryptedData, 'hex', 'utf8');
    decryptedData += decipher.final('utf8');
    return decryptedData;
}

const getScriptLicense = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await Auth.findOne({Client_ID: userId});

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const license = await encrypt(user.Client_ID);

        res.status(200).json(license);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const resetIdentifier = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await Auth.findOne({Client_ID: userId});

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.Cooldown > Date.now()) {
            let timeLeft = user.Cooldown - Date.now();
            //  hours format
            let hours = Math.floor(timeLeft / 1000 / 60 / 60);

            if (hours < 1) {
                hours = Math.floor(timeLeft / 1000 / 60);
                return res.status(400).json({ message: 'You need to wait ' + hours + ' minutes' });
            }

            return res.status(400).json({ message: 'You need to wait ' + hours + ' hours' });
        }

        user.Cooldown = Date.now() + Cooldown;
        user.Identifier = null
        user.Last_Identifier = user.Identifier;

        await user.save();

        res.status(200).json({ message: 'Identifier reset' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const resetcooldownUser = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await Auth.findOne({Client_ID: userId});

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.Cooldown = Date.now();

        await user.save();

        res.status(200).json({ message: 'Cooldown reset' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const authenticateUser = async (req, res) => {
    try {
        let hwid = get_hwid(req.headers);

        let hwid_fetched = get_hwid(req.headers);

        if (!hwid_fetched.success) {
            res.status(400).json({ message: "No HWID found" });
            return;
        }

        let { scriptName, License } = req.body;

        if (!scriptName || !License) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        let newLicense = {
            License : License.split(':')[0],
            Tag : License.split(':')[1]
        }

        let decryptedLicense = decrypt(newLicense.License, newLicense.Tag);

        console.log(decryptedLicense)

        const user = await Auth.findOne({Client_ID: decryptedLicense});


        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.Identifier !== hwid_fetched.data && user.Identifier !== null) {
            return res.status(400).json({ message: 'Invalid HWID' });
        }

        user.Identifier = hwid_fetched.data;
        await user.save();

        if (!user.Assets.includes(scriptName)) {
            return res.status(400).json({ message: 'User does not have access to this script' });
        }

        return res.status(201).json({ message: xorStrings(newLicense.Tag) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = { getScriptLicense, resetIdentifier, resetcooldownUser, authenticateUser };
