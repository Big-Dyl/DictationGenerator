let Weights = {
    skips: [
            [0,11,12,2,4,1,0,0,4,0,4], //chance for Do to skip to: 0 for do, 1 for re, 2 for mi, 3 for fa, 4 for so, 5 for la, 6 for ti, 7 for do(upper), 8 for ti(lower), 9 for la(lower), 10 for so(lower)
            [10,1,15,2,2,1,0,1,2,0,3], //chances for Re
            [5,17,2,22,7,1,0,0,0,0,0], //chances for Mi
            [1,8,19,2,25,5,0,0,0,0,0], //chances for Fa
            [5,1,7,24,1,19,1,4,2,0,0], //chances for So
            [0,0,0,4,21,0,7,0,0,0,0], // chances for La
            [0,0,0,0,0,6,0,9,0,0,0], // chances for ti
            [0,0,0,1,3,1,7,1,0,0,0], //chances for do(upper)
            [8,0,0,0,0,0,0,0,0,1,2], //chances for ti(lower)
            [0,0,0,0,0,0,0,0,0,2,1], //chances for la(lower)
            [5,1,1,0,0,0,0,0,0,0,2], //chances for so(lower)
        ],
    simplerhythms: [0,0.10,0.25,0.65],
    compundrhythms: [0.10,0.25,0.40,0.35],
    major: 0.20,
    simpleTime: 0.20
};
Array.prototype.normalize = function(){
    let s = 0
    for(i = 0; i < this.length; i++){
        s += this[i];
    }
    return this.map((x) => x/s);
}
Array.prototype.softMax = function(){
    let s = 0
    for(i = 0; i < this.length; i++){
        s += Math.pow(Math.E,this[i]);
    }
    return this.map((x) => Math.pow(Math.E,x)/s);
}
let majorKeys = ["CM","GM","DM","AM","EM","BM","D♭M","A♭M","E♭M","B♭M","FM"];
let minorKeys = ["Am","Em","Bm","F♯m","C♯m","G♯m","B♭m","Fm","Cm","Gm","Dm"];
let Song = [];
Weights.skips = Weights.skips.map((x)=>x.softMax());
Array.prototype.pickRandom = function(){
    let r = Math.random();
    let e1 = 0;
    let e2 = this[0];
    for(i = 0; i < this.length; i++){
        if(r > e1 && r < e2){
            return i
        }
        e1 += this[i];
        e2 += this[i+1];
    }
}
class Measure{
    Notes = [];
    constructor(Notes){
        this.Notes = Notes;
    }
    GenerateMeasure(previous, beats, simple){
        if(beats <= 0){
            this.Notes[this.Notes.length - 1].rhythm += beats;
            return;
        }
        if(previous == null){
            previous = new Note(1,1);
            previous.mutate(simple);
            previous.solfege = 1;
            this.Notes.push(previous);
            beats -= previous.rhythm;
        }
        let NextNote = new Note(previous.solfege,0);
        NextNote.mutate(simple);
        if(!simple && beats != 6 && beats != 3 && Math.random > 0.5){
            NextNote.rhythm = 1;
        }
        if(NextNote.rhythm > beats - Math.floor(beats) && beats != Math.floor(beats)){
            NextNote.rhythm = beats - Math.floor(beats);
        }
        this.Notes.push(NextNote);
        this.GenerateMeasure(NextNote,beats - NextNote.rhythm, simple);
    }
}
class Note{
    solfege;
    rhythm;
    constructor(s,r){
        this.solfege = s;
        this.rhythm = r;
    }
    mutate(simple){
        let prev = this.solfege;
        if(this.solfege >= 1){
            let index = Weights.skips[this.solfege - 1].pickRandom();
            Weights.skips[this.solfege - 1][index] /= 6;
            Weights.skips[this.solfege - 1] = Weights.skips[this.solfege - 1].normalize();
            this.solfege = index + 1;
        } else {
            let index =  Weights.skips[8 - this.solfege].pickRandom();
            Weights.skips[8 - this.solfege][index] /= 6;
            Weights.skips[8 - this.solfege] = Weights.skips[8 - this.solfege].normalize();
            this.solfege = index + 1;
        }
        this.solfege = this.solfege > 8 ? 8 - this.solfege + 1 : this.solfege;
        let index = simple ? Weights.simplerhythms.pickRandom() : Weights.compundrhythms.pickRandom();
        this.rhythm = 2 - 0.5 * index; 
        if(Math.random() > 0.75 && prev == 5 && this.solfege == 4){
            this.solfege = 11;
        }
        if(prev == this.solfege && prev == 4){
            this.solfege = 11;
        }
        if(prev == 11){
            this.solfege = 5;
        }
    }
}
let revealed = false;
function reveal(){
    document.getElementById("answer").style.backgroundColor =  revealed ? "#fff" : "#666";
    revealed = !revealed;
}
function makeSong(length){
    Weights.skips = Weights.skips.map((x)=>x.normalize());
    let m = new Measure([]);
    let m2 = new Measure([]);
    let m3 = new Measure([]);
    let m4 = new Measure([]);
    m.GenerateMeasure(null, length, length == 4);
    m2.GenerateMeasure(m.Notes[m.Notes.length - 1], length, length == 4);
    m3.GenerateMeasure(m2.Notes[m2.Notes.length - 1], length, length == 4);
    m4.GenerateMeasure(m3.Notes[m3.Notes.length - 1], length, length == 4);
    let i = length/2;
    while(i > 0){
        if(m4.Notes[m4.Notes.length - 1].rhythm == 1.5){
            m4.Notes[m4.Notes.length - 1].rhythm = 1;
            i -= 0.5
        } else {
            i -= m4.Notes.pop().rhythm;
        }
    }
    m4.Notes.push(new Note(1,length/2));
    Song = [m,m2,m3,m4];
}
function playOrder(song, key){
    let scale;
    let Notes = [];
    let Rhythms = [];
    //major
    if(key == "CM"){
        scale = ["C4","D4","E4","F4","G4","A4","B4","C5","B3","A3","G3","Gb4"]; //index 11 is fi because ap is weird like that sometimes
    }
    if(key == "DM"){
        scale = ["D4","E4","Gb4","G4","A4","B4","Db5","D5","Db4","B3","A3","Ab4"];
    }
    if(key == "EM"){
        scale = ["E4","Gb4","Ab4","A4","B4","Db5","Eb5","E5","Eb4","Db4","B3","Bb4"];
    }
    if(key == "FM"){
        scale = ["F4","G4","A4","Bb4","C5","D5","E5","F5","E4","D4","C4", "B4"];
    }
    if(key == "GM"){
        scale = ["G4","A4","B4","C5","D5","E5","Gb5","G5","Gb4","E4","D4","Db5"];
    }
    if(key == "AM"){
        scale = ["A3","B3","Db4","D4","E4","Gb4","Ab4","A4","Ab3","Gb3","E3","Eb4"];
    }
    if(key == "BM"){
        scale = ["B3","Db4","Eb4","E4","Gb4","Ab4","Bb4","B4","Bb3","Ab3","Gb3","F4"];
    }
    if(key == "D♭M"){
        scale = ["Db4","Eb4","F4","Gb4","Ab4","Bb4","C5","Db5","C4","Bb3","Ab3","G4"];
    }
    if(key == "A♭M"){
        scale = ["Ab3","Bb3","C4","Db4","Eb4","F4","G4","Ab4","G3","F3","Eb3","D4"];
    }
    if(key == "E♭M"){
        scale = ["Eb4","F4","G4","Ab4","Bb4","C5","D5","Eb5","D4","C4","Bb3","A4"];
    }
    if(key == "B♭M"){
        scale = ["Bb3","C4","D4","Eb4","F4","G4","A4","Bb4","A3","G3","F3","E4"];
    }
    //minor
    if(key == "Am"){
        scale = ["A3","B3","C4","D4","E4","F4","G4","A4","G3","F3","E3","Eb4"];
    }
    if(key == "Bm"){
        scale = ["B3","Db4","D4","E4","Gb4","G4","A4","B4","A3","G3","Gb3","F4"];
    }
    if(key == "Cm"){
        scale = ["C4","D4","Eb4","F4","G4","Ab4","Bb4","C5","Bb3","Ab3","G3","Gb4"];
    }
    if(key == "Dm"){
        scale = ["D4","E4","F4","G4","A4","Bb4","C5","D5","C4","Bb3","A3","Ab4"];
    }
    if(key == "Em"){
        scale = ["E4","Gb4","G4","A4","B4","C5","D5","E5","D4","C4","B3","Bb4"];
    }
    if(key == "Fm"){
        scale = ["F4","G4","Ab4","Bb4","C5","Db5","Eb5","F5","Eb4","Db4","C4","B4"];
    }
    if(key == "Gm"){
        scale = ["G4","A4","Bb4","C5","D5","Eb5","F5","G5","F4","Eb4","D4","Db5"];
    }
    if(key == "F♯m"){
        scale = ["Gb4","Ab4","A4","B4","Db5","D5","E5","Gb5","E4","D4","Db4","C5"];
    }
    if(key == "C♯m"){
        scale = ["Db4","Eb4","E4","Gb4","Ab4","A4","B4","Db5","B3","A3","Ab3","G4"];
    }
    if(key == "G♯m"){
        scale = ["Ab3","Bb3","B3","Db4","Eb4","E4","Gb4","Ab4","Gb3","E3","Eb3","D4"];
    }
    if(key == "B♭m"){
        scale = ["Bb3","C4","Db4","Eb4","F4","Gb4","Ab4","Bb4","Ab3","Gb3","F3","E4"];
    }
    if(key.includes("M")){
        for(i = 0; i < song.length; i++){
            for(j = 0; j < song[i].Notes.length; j++){
                let solfege = song[i].Notes[j].solfege;
                Rhythms.push(song[i].Notes[j].rhythm);
                Notes.push(solfege > 0 ? scale[solfege - 1] : scale[8 - solfege]);
            }
        }
    } else {
        for(i = 0; i < song.length; i++){
            for(j = 0; j < song[i].Notes.length; j++){
                let solfege = song[i].Notes[j].solfege;
                Rhythms.push(song[i].Notes[j].rhythm);
                let temp = solfege > 0 ? scale[solfege - 1] : scale[8 - solfege];
                if(j != song[i].Notes.length - 1 && (solfege == 6 || solfege == 7|| solfege == 0 || solfege == -1) && (song[i].Notes[j + 1].solfege > solfege)){
                    if(temp.includes("b")) {
                        temp = temp.substring(0,1) + temp.substring(2,3);
                    } else {
                        temp = String.fromCharCode(temp.charCodeAt(0) + 1) + "b" + temp.substring(1,2); 
                    }
                    if(temp.includes("H")){
                        temp = "A" + temp.substring(1);
                    }
                    if(temp.includes("Fb")){
                        temp = "E" + temp.substring(2);
                    }
                    if(temp.includes("Cb")){
                        temp = "B" + temp.substring(2);
                    }
                } else if (j == song[i].Notes.length - 1 && (solfege == 6 || solfege == 7|| solfege == 0 || solfege == -1) && (song[i+1].Notes[0].solfege > solfege)) {
                    if(temp.includes("b")) {
                        temp = temp.substring(0,1) + temp.substring(2,3);
                    } else {
                        temp = String.fromCharCode(temp.charCodeAt(0) + 1) + "b" + temp.substring(1,2); 
                    }
                    if(temp.includes("H")){
                        temp = "A" + temp.substring(1);
                    }
                    if(temp.includes("Fb")){
                        temp = "E" + temp.substring(2);
                    }
                    if(temp.includes("Cb")){
                        temp = "B" + temp.substring(2);
                    }
                }
                Notes.push(temp);
            }
        }
    }
    return [Notes, Rhythms];
}
function transpose(song, key, simple){
    let scale;
    let output = "";
    //major
    if(key == "CM"){
        scale = ["C","D","E","F","G","A","B","C","B","A","G","F♯"];
    }
    if(key == "DM"){
        scale = ["D","E","F♯","G","A","B","C♯","D","C♯","B","A","G♯"];
    }
    if(key == "EM"){
        scale = ["E","F♯","G♯","A","B","C♯","D♯","E","D♯","C♯","B","A♯"];
    }
    if(key == "FM"){
        scale = ["F","G","A","B♭","C","D","E","F","E","D","C","B"];
    }
    if(key == "GM"){
        scale = ["G","A","B","C","D","E","F♯","G","F♯","E","D","C♯"];
    }
    if(key == "AM"){
        scale = ["A","B","C♯","D","E","F♯","G♯","A","G♯","F♯","E","D♯"];
    }
    if(key == "BM"){
        scale = ["B","C♯","D♯","E","F♯","G♯","A♯","B","A♯","G♯","F♯","F"];
    }
    if(key == "D♭M"){
        scale = ["D♭","E♭","F","G♭","A♭","B♭","C","D♭","C","B♭","A♭","G"];
    }
    if(key == "A♭M"){
        scale = ["A♭","B♭","C","D♭","E♭","F","G","A♭","G","F","E♭","D"];
    }
    if(key == "E♭M"){
        scale = ["E♭","F","G","A♭","B♭","C","D","E♭","D","C","B♭","A"];
    }
    if(key == "B♭M"){
        scale = ["B♭","C","D","E♭","F","G","A","B♭","A","G","F","E"];
    }
    //minor
    if(key == "Am"){
        scale = ["A","B","C","D","E","F","G","A","G","F","E","D♯"];
    }
    if(key == "Bm"){
        scale = ["B","C♯","D","E","F♯","G","A","B","A","G","F♯","F"];
    }
    if(key == "Cm"){
        scale = ["C","D","E♭","F","G","A♭","B♭","C","B♭","A♭","G","F♯"];
    }
    if(key == "Dm"){
        scale = ["D","E","F","G","A","B♭","C","D","C","B♭","A","G♯"];
    }
    if(key == "Em"){
        scale = ["E","F♯","G","A","B","C","D","E","D","C","B","A♯"];
    }
    if(key == "Fm"){
        scale = ["F","G","A♭","B♭","C","D♭","E♭","F","E♭","D♭","C","B"];
    }
    if(key == "Gm"){
        scale = ["G","A","B♭","C","D","E♭","F","G","F","E♭","D","C♯"];
    }
    if(key == "F♯m"){
        scale = ["F♯","G♯","A","B","C♯","D","E","F♯","E","D","C♯","C"];
    }
    if(key == "C♯m"){
        scale = ["C♯","D♯","E","F♯","G♯","A","B","C♯","B","A","G♯","G"];
    }
    if(key == "G♯m"){
        scale = ["G♯","A♯","B","C♯","D♯","E","F♯","G♯","F♯","E","D♯","D"];
    }
    if(key == "B♭m"){
        scale = ["B♭","C","D♭","E♭","F","G♭","A♭","B♭","A♭","G♭","F","E"];
    }
    if(key.includes("M")){
        if(simple){
            for(i = 0; i < song.length; i++){
                for(j = 0; j < song[i].Notes.length; j++){
                    let solfege = song[i].Notes[j].solfege;
                    let rhythm = song[i].Notes[j].rhythm;
                    output += (solfege > 0 ? scale[solfege - 1] : scale[8 - solfege]);
                    if(rhythm == 2){
                        output += "𝅗𝅥";
                    }
                    if(rhythm == 1.5){
                        output += "♩.";
                    }
                    if(rhythm == 1){
                        output += "♩";
                    }
                    if(rhythm == 0.5){
                        output += "♪";
                    }
                    output += " ";
                }
                output += i == 3 ? " ||" : " | ";
            }
        } else {
            for(i = 0; i < song.length; i++){
                for(j = 0; j < song[i].Notes.length; j++){
                    let solfege = song[i].Notes[j].solfege;
                    let rhythm = song[i].Notes[j].rhythm;
                    output += (solfege > 0 ? scale[solfege - 1] : scale[8 - solfege]);
                    if(rhythm == 3){
                        output += "♩.";
                    }
                    if(rhythm == 2){
                        output += "♩";
                    }
                    if(rhythm == 1.5){
                        output += "♪.";
                    }
                    if(rhythm == 1){
                        output += "♪";
                    }
                    if(rhythm == 0.5){
                        output += '<img src="./images/16thnote.png" height="40px">';
                    }
                    output += " ";
                }
                output += i == 3 ? " ||" : " | ";
            }
        }
    } else {
        if(simple){
            for(i = 0; i < song.length; i++){
                for(j = 0; j < song[i].Notes.length; j++){
                    let solfege = song[i].Notes[j].solfege;
                    let rhythm = song[i].Notes[j].rhythm;
                    let temp = solfege > 0 ? scale[solfege - 1] : scale[8 - solfege];
                    if(j != song[i].Notes.length - 1 && (solfege == 6 || solfege == 7|| solfege == 0 || solfege == -1) && (song[i].Notes[j + 1].solfege > solfege)){
                        if(temp.includes("♯")){
                            temp = temp.substring(0,1) + "𝄪" + temp.substring(2,3);
                        } else if(temp.includes("♭")) {
                            temp = temp.substring(0,1) + temp.substring(2,3);
                        } else {
                            temp = temp.substring(0,1) + "♯" + temp.substring(1,2);
                        }
                    } else if (j == song[i].Notes.length - 1 && (solfege == 6 || solfege == 7|| solfege == 0 || solfege == -1) && (song[i+1].Notes[0].solfege > solfege)) {
                        if(temp.includes("♯")){
                            temp = temp.substring(0,1) + "𝄪" + temp.substring(2,3);
                        } else if(temp.includes("♭")) {
                            temp = temp.substring(0,1) + temp.substring(2,3);
                        } else {
                            temp = temp.substring(0,1) + "♯" + temp.substring(1,2);
                        }
                    }
                    output += temp;
                    if(rhythm == 2){
                        output += "𝅗𝅥";
                    }
                    if(rhythm == 1.5){
                        output += "♩.";
                    }
                    if(rhythm == 1){
                        output += "♩";
                    }
                    if(rhythm == 0.5){
                        output += "♪";
                    }
                    output += " ";
                }
                output += i == 3 ? " ||" : " | ";
            }
        } else {
            for(i = 0; i < song.length; i++){
                for(j = 0; j < song[i].Notes.length; j++){
                    let solfege = song[i].Notes[j].solfege;
                    let rhythm = song[i].Notes[j].rhythm;
                    let temp = solfege > 0 ? scale[solfege - 1] : scale[8 - solfege];
                    if(j != song[i].Notes.length - 1 && (solfege == 6 || solfege == 7|| solfege == 0 || solfege == -1) && (song[i].Notes[j + 1].solfege > solfege)){
                        if(temp.includes("♯")){
                            temp = temp.substring(0,1) + "𝄪" + temp.substring(2,3);
                        } else if(temp.includes("♭")) {
                            temp = temp.substring(0,1) + temp.substring(2,3);
                        } else {
                            temp = temp.substring(0,1) + "♯" + temp.substring(1,2);
                        }
                    } else if (j == song[i].Notes.length - 1 && (solfege == 6 || solfege == 7|| solfege == 0 || solfege == -1) && (song[i+1].Notes[0].solfege > solfege)) {
                        if(temp.includes("♯")){
                            temp = temp.substring(0,1) + "𝄪" + temp.substring(2,3);
                        } else if(temp.includes("♭")) {
                            temp = temp.substring(0,1) + temp.substring(2,3);
                        } else {
                            temp = temp.substring(0,1) + "♯" + temp.substring(1,2);
                        }
                    }
                    output += temp;
                    if(rhythm == 3){
                        output += "♩.";
                    }
                    if(rhythm == 2){
                        output += "♩";
                    }
                    if(rhythm == 1.5){
                        output += "♪.";
                    }
                    if(rhythm == 1){
                        output += "♪";
                    }
                    if(rhythm == 0.5){
                        output += '<img src="./images/16thnote.png" height="40px">';
                    }
                    output += " ";
                }
                output += i == 3 ? " ||" : " | ";
            }
        }
    }
    return output;
}
function play(){
    document.getElementById("playbutton").disabled = true;
    let status = playOrder(Song, document.getElementById("Key").innerHTML);
    nextNote(-1 * parseInt(document.getElementById("TS").innerHTML.substring(0,1)), status);
}
function nextNote(i,arr){
    if(i >= arr[0].length){
        document.getElementById("playbutton").disabled = false;
        return;
    }
    if(i < 0){
        let tempo = document.getElementById("Tempo").value;
        var audio = new Audio(`./sounds/drum.mp3`);
        audio.play();
        setTimeout(()=>{audio.pause();audio.currentTime = 0;nextNote(i+1,arr)},(60/tempo) * 1000);
    } else {
        let tempo = document.getElementById("Tempo").value;
        var audio = new Audio(`./sounds/${arr[0][i]}.mp3`);
        audio.play();
        setTimeout(()=>{audio.pause();audio.currentTime = 0;nextNote(i+1,arr)},(60/tempo) * 1000 * arr[1][i]);
    }
}
function Generate(){
    Weights = {
        skips: [
                [0,11,12,2,4,1,0,0,4,0,4], //chance for Do to skip to: 0 for do, 1 for re, 2 for mi, 3 for fa, 4 for so, 5 for la, 6 for ti, 7 for do(upper), 8 for ti(lower), 9 for la(lower), 10 for so(lower)
                [10,1,15,2,2,1,0,1,2,0,3], //chances for Re
                [5,17,2,22,7,1,0,0,0,0,0], //chances for Mi
                [1,8,19,2,25,5,0,0,0,0,0], //chances for Fa
                [5,1,7,24,1,19,1,4,2,0,0], //chances for So
                [0,0,0,4,21,0,7,0,0,0,0], // chances for La
                [0,0,0,0,0,6,0,9,0,0,0], // chances for ti
                [0,0,0,1,3,1,7,1,0,0,0], //chances for do(upper)
                [8,0,0,0,0,0,0,0,0,1,2], //chances for ti(lower)
                [0,0,0,0,0,0,0,0,0,2,1], //chances for la(lower)
                [5,1,1,0,0,0,0,0,0,0,2], //chances for so(lower)
            ],
        simplerhythms: [0,0.10,0.25,0.65],
        compundrhythms: [0.10,0.25,0.40,0.35],
        major: 0.20,
        simpleTime: 0.20
    };
    let major = Math.random() < Weights.major;
    let simple = Math.random() < Weights.simpleTime;
    makeSong(simple ? 4 : 6);
    let key = major ? majorKeys[Math.floor(Math.random() * majorKeys.length)] : minorKeys[Math.floor(Math.random() * minorKeys.length)];
    let pitches = transpose(Song, key, simple);
    document.getElementById("answer").innerHTML = pitches;
    document.getElementById("TS").innerHTML = simple ? "4/4" : "6/8";
    document.getElementById("Key").innerHTML = key;
    console.log(Song);
}