const License = require('../models/licenseModel');
const Auth = require('../models/authModel');
const axios = require('axios');
const FormData = require('form-data');
const randomString = function(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

const generateLicenseKey = async (req, res) => {
    try {
        const { licenseCount , licenseName } = req.body;

        console.log(licenseCount, licenseName);

        if (!licenseCount || !licenseName) {
            return res.status(400).json({ message: 'Please fill all fields' });
        }

        const licenseKeys = [];

        for (let i = 0; i < licenseCount; i++) {
            const key = licenseName + '_' + randomString(25);
            licenseKeys.push(key);
        };

        for (let i = 0; i < licenseCount; i++) {
            const license = License.create({
                License: licenseKeys[i],
                Script_Name: licenseName,
            });
        }

        res.status(201).json({ message: 'License Keys Generated Successfully', licenseKeys });
    } catch(err) {
        console.log(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

const redeemLicenseKey = async (req, res) => {
    try {
        const { licenseKey, userid } = req.body;

        if (!licenseKey || !userid) {
            return res.status(400).json({ message: 'Please fill all fields' });
        }

        const license = await License.findOne({ License: licenseKey });

        if (!license) {
            return res.status(400).json({ message: 'Invalid License Key' });
        }

        if (license.Status != 0) {
            return res.status(400).json({ message: 'License Key already used' });
        }

        let user = await Auth.findOne({ Client_ID: userid });

        let licenseName = license.Script_Name;

        console.log(licenseName, user, license)

        license.Status = 1;
        license.Owner = userid;
        license.save();

        if (!user) {
            user = await Auth.create({
                Client_ID: userid,
                Licenses: [licenseKey],
                Assets: [licenseName],
            });

            return res.status(201).json({ message: 'New User Created and License Key Redeemed Successfully' });
        } else {
            user.Licenses.push(licenseKey);
            user.Assets.push(licenseName);
            user.save();

            return res.status(201).json({ message: 'License Key Redeemed Successfully' });
        }

    } catch(err)  {
        console.log(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const redeemvouchers = async (phone_number, voucher_code) => {
    voucher_code = voucher_code.replace('https://gift.truemoney.com/campaign/?v=', '').trim();

    if (voucher_code.length <= 0) {
        return {
            status: 'FAIL',
            reason: 'Voucher code cannot be empty.'
        };
    }

    const data = {
        mobile: phone_number,
        voucher_hash: voucher_code
    };

    try {
        const response = await axios.post(
            `https://gift.truemoney.com/campaign/vouchers/${voucher_code}/redeem`,
            JSON.stringify(data),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0'
                }
            }
        );

        const resjson = response.data;

        if (resjson.status.code === 'SUCCESS') {
            return {
                status: 'SUCCESS',
                amount: parseInt(resjson.data.voucher.redeemed_amount_baht)
            };
        } else {
            return {
                status: 'FAIL',
                reason: resjson.status.message
            };
        }
    } catch (err) {
        return {
            status: 'FAIL',
            reason: err?.response?.data?.status?.message || err.message || 'Unknown error occurred'
        };
    }
};



const LicenseBuy = async (req, res) => {
    try {
        const { licenseName, VoucherCode } = req.body;

        if (!licenseName || !VoucherCode) {
            return res.status(400).json({ message: 'Please fill all fields' });
        }

        const result = await redeemvouchers(process.env.MOBILE, VoucherCode);

        if (result.status !== 'SUCCESS') {
            return res.status(400).json({ message: result.reason });
        }

        if (result.amount !== 90) {
            return res.status(400).json({ message: 'Voucher amount must be exactly 90 Baht.' });
        }

        const licenseKey = licenseName + '_' + randomString(25);

        await License.create({
            License: licenseKey,
            Script_Name: licenseName
        });

        return res.status(201).json({
            message: 'License Key Generated Successfully',
            licenseKey
        });

    } catch (err) {
        console.error('[LicenseBuy Error]', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

// const LicenseBuy = async (req, res) => {
//     try {
//         const { licenseName, VoucherCode } = req.body;

//         if (!licenseName || !VoucherCode) {
//             return res.status(400).json({ message: 'Please fill all fields' });
//         }

//         const urlPattern = /^https:\/\/gift\.truemoney\.com\/campaign\/\?v=([\w-]+)$/;
//         const match = VoucherCode.match(urlPattern);

//         if (!match) {
//             return res.status(400).json({ message: 'Invalid Voucher Code format' });
//         }

//         const voucherCode = match[1];

//         if (voucherCode.length !== 9) {
//             return res.status(400).json({ message: 'Voucher code must be 9 characters long' });
//         }

//         // ใช้ API byshop.me ด้วย multipart/form-data
//         const formData = new FormData();
//         formData.append("phone", process.env.MOBILE);
//         formData.append("gift_link", `https://gift.truemoney.com/campaign/?v=${voucherCode}`);

//         const response = await axios.post("https://byshop.me/api/truewallet", formData, {
//             headers: formData.getHeaders()
//         });

//         const result = response.data;
//         console.log("TrueWallet Response:", result);

//         if (result.status !== "success") {
//             return res.status(400).json({ errorMessage: result.message || 'Top up failed.' });
//         }

//         const amount = parseFloat(result.amount);

//         if (amount !== 90.00) {
//             return res.status(400).json({ errorMessage: 'Invalid gift voucher amount.' });
//         }

//         // สร้าง License Key
//         const licenseKey = `${licenseName}_${randomString(25)}`;
//         await License.create({
//             License: licenseKey,
//             Script_Name: licenseName,
//         });

//         res.status(201).json({ message: 'License Key Generated Successfully', licenseKey });

//     } catch (err) {
//         console.error("TopUp Error:", err);
//         res.status(500).json({ message: err.message || 'Internal Server Error' });
//     }
// };

// const LicenseBuy = async (req, res) => {
//     try {
//         const { licenseName, VoucherCode } = req.body;

//         if (!licenseName || !VoucherCode) {
//             return res.status(400).json({ message: 'Please fill all fields' });
//         }

//         const urlPattern = /^https:\/\/gift\.truemoney\.com\/campaign\/\?v=([\w-]+)$/;

// 		const match = VoucherCode.match(urlPattern);

// 		if (!match) {
// 			res.status(400).json({ message: 'Invalid Voucher Code' });
// 			return
// 		}

//         const voucherCode = match[1];

//         let data = JSON.stringify({
//             "mobile": process.env.MOBILE,
//             "voucher": voucherCode,
//         });

//         const test = await axios.request({
//             method: 'post',
//             maxBodyLength: Infinity,
//             url: 'https://voucher.meowcdn.xyz/api',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'User-Agent': 'multilabxxxxxxxx'
//             },
//             data: data
//         })

//         var response = test.data;

//         console.log(response);

//         if (response['status']['code'] == "VOUCHER_OUT_OF_STOCK") {
//             return res.status(400).json({ errorMessage: 'Gift voucher out of stock.' });
//         } else if (response['status']['code'] == "INVALID_LINK" || response['status']['code'] == "VOUCHER_NOT_FOUND") {
//             return res.status(400).json({ errorMessage: 'Invalid gift voucher code.' });
//         } else if (response['status']['code'] == "VOUCHER_EXPIRED") {
//             return res.status(400).json({ errorMessage: 'Gift voucher expired.' });
//         } else if (response['status']['code'] == "CANNOT_GET_OWN_VOUCHER") {
//             return res.status(400).json({ errorMessage: 'Cannot get own gift voucher.' });
//         }

//         let amount = response['data']['voucher']['amount_baht'].toString().replace(',', '');

//         console.log(amount)

//         if (amount != '90.00') {
//             return res.status(400).json({ errorMessage: 'Invalid gift voucher amount.' });
//         }

//         let licenseKey = licenseName + '_' + randomString(25);

//         await License.create({
//             License: licenseKey,
//             Script_Name: licenseName,
//         });

//         res.status(201).json({ message: 'License Key Generated Successfully ', licenseKey});
//     } catch(err)  {
//         console.log(err);
//         res.status(500).json({ message: 'Internal Server Error' });
//     }
// }

module.exports = {
    generateLicenseKey,
    redeemLicenseKey,
    LicenseBuy
}