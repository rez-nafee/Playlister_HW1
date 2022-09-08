import jsTPS from "../common/jsTPS.js";
import Playlist from "./Playlist.js";
import AddSong_Transaction from "./transactions/AddSong_Transaction.js";

import MoveSong_Transaction from "./transactions/MoveSong_Transaction.js";
import UpdateSong_Transaction from "./transactions/UpdateSong_Transaction.js";
import RemoveSong_Transaction from "./transactions/RemoveSong_Transaction.js";

/**
 * PlaylisterModel.js
 * 
 * This class manages all playlist data for updating and accessing songs
 * as well as for loading and unloading lists. Note that editing should employ
 * an undo/redo mechanism for any editing features that change a loaded list
 * should employ transactions the jsTPS.
 * 
 * Note that we are employing a Model-View-Controller (MVC) design strategy
 * here so that when data in this class changes it is immediately reflected
 * inside the view of the page.
 * 
 * @author McKilla Gorilla
 * @author Rezvan Nafee
 */
export default class PlaylisterModel {
    /*
        constructor

        Initializes all data for this application.
    */
    constructor() {
        // THIS WILL STORE ALL OF OUR LISTS
        this.playlists = [];

        // THIS IS THE LIST CURRENTLY BEING EDITED
        this.currentList = null;

        // THIS WILL MANAGE OUR TRANSACTIONS
        this.tps = new jsTPS();

        // WE'LL USE THIS TO ASSIGN ID NUMBERS TO EVERY LIST
        this.nextListId = 0;

        // THE MODAL IS NOT CURRENTLY OPEN
        this.confirmDialogOpen = false;
    }

    // FOR MVC STUFF
    
    setView(initView) {
        this.view = initView;
    }

    refreshToolbar() {
        this.view.updateToolbarButtons(this);
    }
    
    // FIRST WE HAVE THE ACCESSOR (get) AND MUTATOR (set) METHODS
    // THAT GET AND SET BASIC VALUES NEEDED FOR COORDINATING INTERACTIONS
    // AND DISPLAY

    getList(index) {
        return this.playlists[index];
    }

    getListIndex(id) {
        for (let i = 0; i < this.playlists.length; i++) {
            let list = this.playlists[i];
            if (list.id === id) {
                return i;
            }
        }
        return -1;
    }

    getPlaylistSize() {
        return this.currentList.songs.length;
    }

    getSong(index) {
        return this.currentList.songs[index];
    }

    getDeleteListId() {
        return this.deleteListId;
    }

    setDeleteListId(initId) {
        this.deleteListId = initId;
    }

    toggleConfirmDialogOpen() {
        this.confirmDialogOpen = !this.confirmDialogOpen;
        this.view.updateToolbarButtons(this);
        return this.confirmDialogOpen;
    }

    // THESE ARE THE FUNCTIONS FOR MANAGING ALL THE LISTS
    addNewList(initName, initSongs) {
        let newList = new Playlist(this.nextListId++);
        if (initName)
            newList.setName(initName);
        if (initSongs)
            newList.setSongs(initSongs);
        this.playlists.push(newList);
        this.sortLists();
        this.view.refreshLists(this.playlists);
        return newList;
    }

    sortLists() {
        this.playlists.sort((listA, listB) => {
            if (listA.getName().toUpperCase() < listB.getName().toUpperCase()) {
                return -1;
            }
            else if (listA.getName().toUpperCase() === listB.getName().toUpperCase()) {
                return 0;
            }
            else {
                return 1;
            }
        });
        this.view.refreshLists(this.playlists);
    }

    hasCurrentList() {
        return this.currentList !== null;
    }

    unselectAll() {
        for (let i = 0; i < this.playlists.length; i++) {
            let list = this.playlists[i];
            this.view.unhighlightList(list.id); // Was : this.view.unhighlightList(i);
        }
    }

    loadList(id) {
        // If user attempts to reload the currentList, then do nothing.
        if (this.hasCurrentList() && id === this.currentList.id) {
            this.view.highlightList(id);
            return;
        }

        let list = null;
        let found = false;
        let i = 0;
        while ((i < this.playlists.length) && !found) {
            list = this.playlists[i];
            if (list.id === id) {
                // THIS IS THE LIST TO LOAD
                this.currentList = list;
                this.view.refreshPlaylist(this.currentList);
                this.view.highlightList(id); // Was : this.view.highlightList(i);
                found = true;
            }
            i++;
        }
        this.tps.clearAllTransactions();
        this.view.updateStatusBar(this);
        this.view.updateToolbarButtons(this);
    }

    loadLists() {
        // CHECK TO SEE IF THERE IS DATA IN LOCAL STORAGE FOR THIS APP
        let recentLists = localStorage.getItem("recent_work");
        if (!recentLists) {
            return false;
        }
        else {
            let listsJSON = JSON.parse(recentLists);
            this.playlists = [];
            for (let i = 0; i < listsJSON.length; i++) {
                let listData = listsJSON[i];
                let songs = [];
                for (let j = 0; j < listData.songs.length; j++) {
                    songs[j] = listData.songs[j];
                }
                this.addNewList(listData.name, songs);
            }
            this.sortLists();   
            this.view.refreshLists(this.playlists);
            return true;
        }        
    }

    saveLists() {
        let playlistsString = JSON.stringify(this.playlists);
        localStorage.setItem("recent_work", playlistsString);
    }

    restoreList() {
        this.view.update(this.currentList);
    }

    unselectCurrentList() {
        if (this.hasCurrentList()) {
            this.currentList = null;
            this.view.updateStatusBar(this);
            this.view.clearWorkspace();
            this.tps.clearAllTransactions();
            this.view.updateToolbarButtons(this);
        }
    }

    renameCurrentList(initName, id) {
        if (this.hasCurrentList()) {
            let targetList = this.playlists[this.getListIndex(id)];

            if (initName === "") {
                targetList.setName("Untitled");
            } else {
                targetList.setName(initName);
            }

            this.sortLists(); 
            this.view.highlightList(id);
            this.saveLists();
            this.view.updateStatusBar(this);
        }
    }

    deleteList(id) {
        let toBeDeleted = this.playlists[this.getListIndex(id)];
        this.playlists = this.playlists.filter(list => list.id !== id);
        this.view.refreshLists(this.playlists)
        // 2 cases, deleted is current list
        // deleted is not current list
        if (toBeDeleted == this.currentList) {
            this.currentList = null;
            this.view.clearWorkspace();
            this.tps.clearAllTransactions();
            this.view.updateStatusBar(this);
        } else if (this.hasCurrentList()) {
            this.view.highlightList(this.currentList.id);
        }
        this.saveLists();
    }

    // NEXT WE HAVE THE FUNCTIONS THAT ACTUALLY UPDATE THE LOADED LIST
    moveSong(fromIndex, toIndex) {
        if (this.hasCurrentList()) {
            let tempArray = this.currentList.songs.filter((song, index) => index !== fromIndex);
            tempArray.splice(toIndex, 0, this.currentList.getSongAt(fromIndex))
            this.currentList.songs = tempArray;
            this.view.refreshPlaylist(this.currentList);
        }
        this.saveLists();
    }

    // THESE ARE THE FUNCTIONS FOR MANAGING THE SONGS IN THE PLAYLIST

    addSong(){
        // Create an empty song to be added to the current list
        let song = {
            title: 'Untitled',
            artist: 'Unknown',
            youTubeId: 'dQw4w9WgXcQ'
        }

        // Append the song to the end of the songs array of the current list
        this.currentList.songs.push(song);

        // Refresh the view and save the songs we have in in the Playlist App
        this.view.refreshPlaylist(this.currentList);
        this.saveLists();
        
        // Return the song's ID number
        return this.currentList.songs.length - 1;
    }

    addSongAt(songId, song){
        let tempSongArray = [...this.currentList.songs];

        //Start at the specified index, delete 0 songs, and insert the song 
        tempSongArray.splice(songId, 0, song);

        //Update the current list of songs 
        this.currentList.setSongs(tempSongArray);

        // Refresh the view and save the songs we have in in the Playlist App
        this.view.refreshPlaylist(this.currentList);
        this.saveLists();
    }

    removeSong(songId){
        // Make a copy of the current list of songs 
        let tempSongArray = [...this.currentList.songs]
        
        // Find the song with the specified songId
        let tempSong = tempSongArray[songId]

        // Then find the index of the song that needs to be removed from the current list of songs
        let index = tempSongArray.indexOf(tempSong)

        // Remove the song that was selected from the copy of the songs 
        tempSongArray.splice(index, 1)

        console.log(this.currentList.songs)
        console.log(tempSongArray)

        //Update the current list of songs 
        this.currentList.setSongs(tempSongArray);

        // Refresh the view and save the songs we have in in the Playlist App
        this.view.refreshPlaylist(this.currentList);
        this.saveLists();

        //Return the song that was removed
        return tempSong
    }

    updateSong (songId, title, artist, youTubeId) {
        // Make a copy of the current list of songs 
        let tempSongArray = [...this.currentList.songs]
        
        // Create a new song to reflect the new changes made by the user
        let tempSong = {
            title: title,
            artist: artist,
            youTubeId: youTubeId
        }

        // Update the song at the specified index 
        tempSongArray[songId] = tempSong

        //Update the current list of songs 
        this.currentList.setSongs(tempSongArray);

        // Refresh the view and save the songs we have in in the Playlist App
        this.view.refreshPlaylist(this.currentList);
        this.saveLists();
    }
    

    // SIMPLE UNDO/REDO FUNCTIONS, NOTE THESE USE TRANSACTIONS

    undo() {
        if (this.tps.hasTransactionToUndo()) {
            this.tps.undoTransaction();
            this.view.updateToolbarButtons(this);
        }
    }

    redo() {
        if (this.tps.hasTransactionToRedo()) {
            this.tps.doTransaction();
            this.view.updateToolbarButtons(this);
        }
    }

    // NOW THE FUNCTIONS THAT CREATE AND ADD TRANSACTIONS
    // TO THE TRANSACTION STACK
    addMoveSongTransaction(fromIndex, onIndex) {
        let transaction = new MoveSong_Transaction(this, fromIndex, onIndex);
        this.tps.addTransaction(transaction);
        this.view.updateToolbarButtons(this);
    }

    addSongTransaction(){
        let transaction = new AddSong_Transaction(this);
        this.tps.addTransaction(transaction);
        this.view.updateToolbarButtons(this);
    }

    removeSongTransaction(songId){
        let transaction = new RemoveSong_Transaction(this, songId);
        this.tps.addTransaction(transaction)
        this.view.updateToolbarButtons(this)
    }

    updateSongTransaction(songId, title, artist, youTubeID, oldTitle, oldArtist, oldYoutubeId){
        let transaction = new UpdateSong_Transaction(this, songId, title, artist, youTubeID, oldTitle, oldArtist, oldYoutubeId)
        this.tps.addTransaction(transaction)
        this.view.updateToolbarButtons(this);
    }
}