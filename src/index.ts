import express from 'express';
import http from 'http';
import GameService from './service/GameService';
import { BACKEND_URL, FRONTEND_URL, PORT } from './static';
import cors from 'cors';
const app = express();
const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.BACKEND_URL
  ];
app.use(cors({
    origin: function(origin, callback){
        if(!origin) callback(null, true);
        if(allowedOrigins.includes(origin!)) callback(null, true);
        else callback(new Error('origin not allowed'));
    }
}));
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
const server = http.createServer(app);

let gameService = new GameService(server);

app.get('/ping', (req, res) => res.send('OK'));

setInterval(() => {
    fetch(BACKEND_URL).then((res) => {
        console.log(res);
    }).catch(e => console.log(e));
}, 10 * 60 * 1000);

server.listen(PORT, () => {
    console.log(`Server Running at PORT: ${PORT}`);
});
