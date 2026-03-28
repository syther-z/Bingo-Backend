import { Socket } from "socket.io";
import Player from "./Player";
import { GameEvent } from "../event/GameEvent";
import { resolve } from "node:dns";

class Room{
    #roomID: number;
    #currentTurn: number = 0;
    #started: boolean = false;
    #tileNumbers: Array<number> = [];
    players: Array<Player> = [];
    constructor(roomID : number, hostPlayer : Player){
        this.#roomID = roomID;
        this.players.push(hostPlayer);
        for(let i = 0; i < 25; i++) this.#tileNumbers.push(i+1);
    }

    getID(){
        return this.#roomID;
    }

    getCurrentTurn(){
        return this.#currentTurn;
    }

    getStarted(){
        return this.#started;
    }

    getListOfPlayers(){
        return this.players.map((player, i) => {
            return {
                id: player.getSocket().id,
                name: player.getName(),
                ping: player.getPing()
            };
        });
    }

    send(key : string, data : any){
        this.players.forEach((player, i) => {
            player.getSocket().emit(key, data);
        });
    }


    async onStartGame(player: Player){
        if(player.getType() !== "HOST") return;
        if(this.players.length < 2) return;
        this.resolveTurn();
        return await new Promise((resolve, reject) => {
            this.players.forEach((player, i) => {
                player.send(GameEvent.RSTARTGAME, {
                    turn: player.getTurn(),
                    currentTurn: this.getCurrentTurn()
                });
            });
            this.#started = true;
            resolve(0);
        })
    }
    

    onMarkNum(num: number, player: Player){
        if(this.isNumMarked(num)) return;
        let invalid = (num <= 0 || num > 25);
        invalid ||= this.getCurrentTurn() !== player.getTurn();
        if(invalid){
            player.send(GameEvent.RMARKNUM, {
                valid: false,
                num,
                currentTurn: this.getCurrentTurn()
            });
            return;
        }
        this.setNumUsed(num);
        //sending number to all
        this.changeTurn();
        this.send(GameEvent.RMARKNUM, {
            valid: true,
            num,
            currentTurn: this.getCurrentTurn()
        });
    }


    isNumMarked(num : number){
        return this.#tileNumbers[num-1] === -1;
    }

    setNumUsed(num : number){
        this.#tileNumbers[num-1] = -1;
    }

    addPlayer(player: Player){
        this.players.push(player);
        return this.getListOfPlayers();
    }

    removePlayer(player: Player){
        const idx = this.players.indexOf(player);
        if(idx == -1) return false;
        this.players[idx].getSocket().removeAllListeners();
        this.players.splice(idx, 1);
        if(this.#started) this.resolveTurn();

        return true;
    }

    changeTurn(){
        this.#currentTurn = (this.#currentTurn + 1) % this.players.length;
        // this.send(GameEvent.RCURRENTTURN, {
        //     currentTurn: this.#currentTurn
        // });
    }

    skipPlayerTurn(player: Player){
        if(this.getCurrentTurn() !== player.getTurn()) return;
        this.changeTurn();
        this.send(GameEvent.RTURNCHANGE, {
            currentTurn: this.getCurrentTurn()
        });
    }


    resolveTurn(){
        for(let i = 0; i < this.players.length; i++){
            this.players[i].setTurn(i);
            // this.players[i].send(GameEvent.)
        }
        
    }

    winHandle(player: Player){
        return this.send(GameEvent.RWINNER, {
            name: player.getName(),
            id: player.getSocket().id
        });
    }
    

}

export default Room;