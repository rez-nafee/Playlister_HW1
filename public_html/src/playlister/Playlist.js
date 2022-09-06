/**
 * Playlist.js
 * 
 * This class represents our playlist.
 * 
 * @author McKilla Gorilla
 * @author Rezvan Nafee
 */
export default class Playlist {
    constructor(initId) {
        this.id = initId;
        this.songs = []
        this.name = ''
    }

    // Returns the name of the Playlist
    getName() {
        return this.name;
    }

    // Updates the name of the playlist 
    setName(initName) {
        this.name = initName;
    }
    
    // Returns the song at the specified song
    getSongAt(index) {
        return this.songs[index];
    }

    // Given a position in the playlist, update the position with the song provided. 
    setSongAt(index, song) {
        this.songs[index] = song;
    }

    // Updates the list of songs of the playlist.
    setSongs(initSongs) {
        this.songs = initSongs;
    }

    // Inserts song at specified index 
    // .splice (start, deleteCount, items)
    moveSong(oldIndex, newIndex) {
        this.songs.splice(newIndex, 0, this.songs.splice(oldIndex, 1)[0]);
    }
}