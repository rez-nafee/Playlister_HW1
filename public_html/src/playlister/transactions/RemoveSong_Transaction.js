import jsTPS_Transaction from "../../common/jsTPS.js"

export default class RemoveSong_Transaction extends jsTPS_Transaction{
    constructor(initModel, songId){
        super();
        this.model = initModel;
        this.songId = songId;
    }

    doTransaction(){
        this.song = this.model.removeSong(this.songId)
    }

    undoTransaction(){
        this.model.addSongAt(this.songId, this.song)
    }
}