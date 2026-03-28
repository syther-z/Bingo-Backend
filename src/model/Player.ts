import { Socket } from "socket.io";
import { GameEvent } from "../event/GameEvent";

type PlayerType = ("JOIN"|"HOST");

class Player{
    #name : string;
    #turn: number = -1;
    #socket: Socket;
    #roomID: number;
    #type: PlayerType;
    #lastPing = -1;
    constructor(roomID : number, socket : Socket, name : string, type: PlayerType){
        this.#name = name || `Player-${socket.id.slice(0, 4)}`;
        // this.#turn = turn;
        this.#socket = socket;
        this.#roomID = roomID;
        this.#type = type;
    }

    send(key: string, data : any){
        this.getSocket().emit(key, data);
    }

    sendAlert(data: any){
        return this.send(GameEvent.RALERT, data);
    }

    getRoomID(){
        return this.#roomID;
    }

    getName(){
        return this.#name;
    }

    getTurn(){
        return this.#turn;
    }

    getSocket(){
        return this.#socket;
    }

    getType(){
        return this.#type;
    }

    setTurn(turn : number){
        this.#turn = turn;
    }

    getPing(){
        return this.#lastPing;
    }
    
    setPing(ping: number){
        this.#lastPing = ping;
    }


}

export default Player;