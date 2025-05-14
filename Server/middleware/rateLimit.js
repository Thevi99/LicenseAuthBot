const time = () => Math.floor(new Date().getTime() / 1000);

class Ratelimiter {
    constructor(maxRequests, seconds) {
        this.rateLimitList = {};
        this.max = maxRequests;
        this.sec = seconds;
        this.IsRatelimited = ip => {
            const data = this.rateLimitList[ip];
            if (!data) {
                this.rateLimitList[ip] = { lastRequest: time(), requests: 1 };
            } else {
                if ((data.lastRequest + this.sec) < time()) {
                    data.lastRequest = time();
                    data.requests = 1;
                } else {
                    data.requests++;
                    if (data.requests > this.max) return true;
                    this.rateLimitList[ip] = data;
                }
            }
            return false;
        };
    }
}

const limiter = new Ratelimiter(10, 60);

const rateLimitMiddleware = (req, res, next) => {
    const ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '').split(',')[0].trim();

    if (limiter.IsRatelimited(ip)) {
        console.log(`[RATE LIMIT] IP ${ip} ถูกจำกัดชั่วคราว`);
        return res.status(429).json({ message: 'Too many requests. Please try again later.' });
    }

    next();
};

module.exports = rateLimitMiddleware; // ✅ ตรงนี้สำคัญสุด
