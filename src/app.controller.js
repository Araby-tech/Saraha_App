import path from "node:path"
import *as dotenv from "dotenv"
// dotenv.config({ path: path.join('./src/config/.env.dev') })
dotenv.config({})
import authController from './modules/auth/auth.controller.js';
import messageController from './modules/message/message.controller.js';
import userController from './modules/user/user.controller.js'
import express from "express";
import connectDB from './DB/connection.db.js';
import { globalErrorHandling } from './utils/response.js';
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from "express-rate-limit"

const bootstrap = async () => {
    const app = express();
    const port = process.env.PORT || 5000;


    // var whitelist = process.env.ORIGINS.split(",") || []
    // app.use(async (req, res, next) => {
    //     if (!whitelist.includes(req.header('origin'))) {
    //         return next(new Error('Not Allowed By CORS', { status: 403 }))
    //     }
    //     for (const origin of whitelist) {
    //         if (req.header('origin') == origin) {
    //             await res.header('Access-Control-Allow-Origin', origin);
    //             break;
    //         }
    //     }
    //     await res.header('Access-Control-Allow-Headers', '*')
    //     await res.header("Access-Control-Allow-Private-Network", 'true')
    //     await res.header('Access-Control-Allow-Methods', '*')
    //     console.log("Origin Work");
    //     next();
    // });



    //DB
    await connectDB();

    //cors

    // var corsOptions = {
    //     origin: function (origin, callback) {
    //         if (whitelist.indexOf(origin) !== -1) {
    //             callback(null, true)
    //         } else {
    //             callback(new Error('Not allowed by CORS'))
    //         }
    //     }
    // }


    app.use(cors())
    app.use(helmet())

    const limiter = rateLimit({
        windowMs: 60 * 60 * 1000,
        limit: 20000,
        statusCode: 400,
        handler: (req, res, next, options) => {
            return res.status(500).json(options.message)
        },
        standardHeaders:"draft-8"
    })
    app.use("/auth", limiter)
    app.use("/uploads", express.static(path.resolve("./src/uploads")))

    //Convert Buffer Data
    app.use(express.json());
    //app-Routing
    app.get('/', (req, res) => res.json({ message: 'Welcome to app ' }));
    app.use('/auth', authController);
    app.use("/user", userController)
    app.use("/message", messageController)
    app.all('{/*dummy}', (req, res) => res.status(404).json({ message: "In-Valid app routing" }));

    app.use(globalErrorHandling)

    return app.listen(port, () => console.log(`App listening on port ${port}!`));
};

export default bootstrap;
