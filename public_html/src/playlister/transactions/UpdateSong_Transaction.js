import jsTPS_Transaction from "../../common/jsTPS.js";

export default class UpdateSong_Transaction extends jsTPS_Transaction {
    constructor(initModel, songId, title, artist, youTubeID, oldTitle, oldArtist, oldYoutubeId) {
        super();
        this.model = initModel;
        this.songId = songId;
        this.title = title;
        this.artist = artist;
        this.youTubeID = youTubeID;
        this.oldTitle = oldTitle;
        this.oldArtist = oldArtist;
        this.oldYoutubeId = oldYoutubeId;
    }

    doTransaction(){
        this.model.updateSong(this.songId, this.title, this.artist, this.youTubeID)
    }

    undoTransaction(){
        this.model.updateSong(this.songId, this.oldTitle, this.oldArtist, this.oldYoutubeId)
    }


}