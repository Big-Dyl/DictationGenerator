let PossibleNotes = ["C3","Db3","D3","Eb3","E3","F3","Gb3","G3","Ab3","A3","Bb3","B3","C4","Db4","D4","Eb4","E4","F4","Gb4","G4","Ab4","A4","Bb4","B4","C5","Db5","D5","Eb5","E5","F5","Gb5","G5","Ab5","A5","Bb5","B5"];
let PossibleRhythms = [0.5,0.25,0.75];
let numerator = [3,4,5,6,7];
let denomenator = [4,8];
let Song = [];
class Measure{
    Notes = [];
    constructor(Notes){
        this.Notes = Notes;
    }
    GenerateMeasure(beats){
        if(beats <= 0){
            this.Notes[this.Notes.length - 1].rhythm += beats;
            return;
        }
        let NextNote = new Note();
        this.Notes.push(NextNote);
        this.GenerateMeasure(beats - NextNote.rhythm);
    }
}
class Note{
    pitch;
    rhythm;
    constructor(){
        this.pitch = PossibleNotes[Math.floor(Math.random() * PossibleNotes.length)];
        this.rhythm = PossibleRhythms[Math.floor(Math.random() * PossibleRhythms.length)];
    }
}
function Generate(){
    let beats = numerator[Math.floor(Math.random() * numerator.length)];
    let d = denomenator[Math.floor(Math.random() * denomenator.length)];
    let pitches = "";
    let m = new Measure([]);
    let m2 = new Measure([]);
    let m3 = new Measure([]);
    let m4 = new Measure([]);
    m.GenerateMeasure(beats);
    m2.GenerateMeasure(beats);
    m3.GenerateMeasure(beats);
    m4.GenerateMeasure(beats);
    Song = [m,m2,m3,m4]; 
    let key = Song[0].Notes[0].pitch;
    if(d == 4){
        for(i = 0; i < 4; i++){
            for(j = 0; j < Song[i].Notes.length; j++){
                pitches += Song[i].Notes[j].pitch;
                if(Song[i].Notes[j].rhythm == 0.5){
                    pitches += "♪ ";
                }
                if(Song[i].Notes[j].rhythm == 0.75){
                    pitches += "♪. ";
                }
                if(Song[i].Notes[j].rhythm == 0.25){
                    pitches += "𝅘𝅥𝅯 ";
                }
            }
            pitches += i == 3 ? " ||" : " | ";
        }
    }
    if(d == 8){
        for(i = 0; i < 4; i++){
            for(j = 0; j < Song[i].Notes.length; j++){
                pitches += Song[i].Notes[j].pitch;
                if(Song[i].Notes[j].rhythm == 0.5){
                    pitches += "𝅘𝅥𝅯  ";
                }
                if(Song[i].Notes[j].rhythm == 0.75){
                    pitches += "𝅘𝅥𝅯. ";
                }
                if(Song[i].Notes[j].rhythm == 0.25){
                    pitches += "𝅘𝅥𝅰 ";
                }
            }
            pitches += i == 3 ? " ||" : " | ";
        }
    }
    document.getElementById("answer").innerHTML = pitches;
    document.getElementById("TS").innerHTML = `${beats}/${d}`;
    document.getElementById("Key").innerHTML = key;
    console.log(Song);
}
function play(){
    let pitches = [];
    let rhythms = [];
    for(i = 0; i < 4; i++){
        for(j = 0; j < Song[i].Notes.length; j++){
            pitches.push(Song[i].Notes[j].pitch);
            rhythms.push(Song[i].Notes[j].rhythm);
        }
    }
    nextNote(0, [pitches,rhythms])
}
function nextNote(i,arr){
    if(i >= arr[0].length){
        return;
    }
    let tempo = document.getElementById("Tempo").value;
    var audio = new Audio(`./sounds/${arr[0][i]}.mp3`);
    audio.play();
    setTimeout(()=>{audio.pause();audio.currentTime = 0;nextNote(i+1,arr)},(60/tempo) * 1000 * arr[1][i]);
}
