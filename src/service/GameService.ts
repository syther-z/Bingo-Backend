import http from "node:http";
import { Server } from "socket.io";
import Room from "../model/Room";
import { GameEvent } from "../event/GameEvent";
import Player from "../model/Player";
import { Socket } from "socket.io";
import { start } from "node:repl";
import { FRONTEND_URL, MAX_PLAYER } from "../static";
class GameService{
    #io: Server;
    rooms: {[key: string]: Room} = {};
    sockIDToPlayers: {[key: string]: Player} = {};
    constructor(server: http.Server){
        this.#io = new Server(server, {
            cors: {
                origin: process.env.FRONTEND_URL
            }
        });



        this.#io.on("connection", socket => {
            socket.removeAllListeners();
            //HOST GAME
            socket.on(GameEvent.SHOST, (data) => {
                const { roomID, name, startTime } = data ?? {};
                if(this.rooms[roomID]){
                    socket.emit(GameEvent.RALERT, {
                        message: 'Room already exist',
                        type: "error"
                    });
                    return;
                }
                if(!roomID){
                    socket.emit(GameEvent.RALERT, {
                        message: 'Invalid room id',
                        type: "error"
                    });
                    return;
                }
                let player = new Player(roomID, socket, name, "HOST");
                let room = new Room(roomID, player);
                this.rooms[roomID] = room;
                this.sockIDToPlayers[socket.id] = player;
                if(typeof startTime === "number"){
                    player.setPing(Date.now() - startTime);
                }
                // console.log(socket.id, 'Hosted Room');
                player.send(GameEvent.RPLAYERJOIN, {
                    listOfPlayers: room.getListOfPlayers()
                });
            });

            //JOIN GAME
            socket.on(GameEvent.SJOIN, (data) => {
                const { roomID, name, startTime} = data ?? {};
                const latency = (typeof startTime === "number") ? (Date.now() - startTime) : undefined;
                if(!(roomID in this.rooms)){
                    socket.emit(GameEvent.RALERT, {
                        message: 'Room doesn\'t exist',
                        type: "error"
                    });
                    return;
                }
                if(this.rooms[roomID].getListOfPlayers().length >= MAX_PLAYER){
                    socket.emit(GameEvent.RALERT, {
                        message: 'Room is full',
                        type: "error"
                    });
                    return;
                }
                const player = new Player(roomID, socket, name, "JOIN");
                if(typeof latency === "number"){
                    player.setPing(latency);
                }
                const list = this.rooms[roomID].addPlayer(player);
                this.sockIDToPlayers[socket.id] = player;
                player.send(GameEvent.RJOIN, {}); // Specific allowance of in
                this.rooms[roomID].send(GameEvent.RPLAYERJOIN, { // sending player count
                    listOfPlayers: list
                }); // sending on acceptance
            });

            //PLAYER LEFTS
            socket.on("disconnect", () => {
                if(!this.sockIDToPlayers[socket.id]) return;
                const player = this.sockIDToPlayers[socket.id];
                const room = this.rooms[player.getRoomID()];
                if(!room){
                    delete this.sockIDToPlayers[socket.id];
                    socket.removeAllListeners();
                    return;
                }
                if(room.getListOfPlayers().length === 1){
                    delete this.rooms[player.getRoomID()];
                } else room.removePlayer(player);

                delete this.sockIDToPlayers[socket.id];
                socket.removeAllListeners();
                room.send(GameEvent.RPLAYERJOIN, { // sending player count
                    listOfPlayers: room.getListOfPlayers(),
                    maxPlayerCount: MAX_PLAYER
                });
            });
             
            //START GAME
            socket.on(GameEvent.SSTARTGAME, (data) => {
                const room = this.validate(socket, data);
                if(room == null) return;
                const player = this.sockIDToPlayers[socket.id];
                room.onStartGame(player);

            });

            //MARK NUMBER
            socket.on(GameEvent.SMARKNUM, (data) => {
                const room = this.validate(socket, data);
                if(room == null){
                    return;
                }
                const player = this.sockIDToPlayers[socket.id];
                room.onMarkNum(data.num, player);
            });

            //RETURN PLAYERS
            socket.on(GameEvent.PLAYERCOUNT, (data) => {
                const room = this.validate(socket, data);
                if(room == null) return;
                
                const player = this.sockIDToPlayers[socket.id];
                player.send(GameEvent.RPLAYERJOIN, { // sending player count to specific user on demand
                    listOfPlayers: room.getListOfPlayers(),
                    maxPlayerCount: MAX_PLAYER
                })
            });

            socket.on(GameEvent.STURNCHANGE, (data) => {
                const room = this.validate(socket, data);
                if(room === null) return;
                const player = this.sockIDToPlayers[socket.id];
                room.skipPlayerTurn(player);
            });

            socket.on(GameEvent.SWINNER, (data) => {
                const room = this.validate(socket, data);
                if(room === null) return;
                const player = this.sockIDToPlayers[socket.id];
                room.winHandle(player);
            });

            socket.on(GameEvent.PING, (start, ack) => {
                const player = this.sockIDToPlayers[socket.id];
                if(!player) return;
                if(typeof start === "number"){
                    player.setPing(Date.now() - start);
                }
                if(typeof ack === "function") ack();
            });

            socket.on(GameEvent.SPING, (data) => {
                const { latency } = data ?? {};
                const player = this.sockIDToPlayers[socket.id];
                if(!player) return;
                if(typeof latency === "number"){
                    player.setPing(latency);
                }
            });

        });

    
    }
    validate(socket : Socket, data : any){
        if(!this.sockIDToPlayers[socket.id]) return null;
        const { roomID } = data ?? {};
        if(!roomID || !this.rooms[roomID]) return null;
        const player = this.sockIDToPlayers[socket.id];

        return player.getRoomID() === roomID ? this.rooms[roomID] : null;
    }
}

export default GameService;
