import { Model, fields } from 'catwalk';

import { Wave } from "./instruments";
import { Pattern } from "./pattern";

const PATTERN_COUNT = 64;
const INSTRUMENT_COUNT = 15;

const PLAYER_CODE = `
note_freqs={}
for n=1,107 do
 note_freqs[n]=440*2^((n-58)/12)
end

chan_states={}
for i=0,3 do
 chan_states[i]={inst=1,iframe=0,nfreq=440}
end

row_frame=0
row_num=0
position_num=0
pattern_num=0

function fetch_position()
 pattern_num=positions[position_num+1]
 row_num=0
end

fetch_position()

function read_row()
 for c=0,3 do
  note=patterns[pattern_num][c+1][row_num+1]
  note_num=note[1]
  if note_num~=0 then
   chan=chan_states[c]
   inst=note[2]
   if inst~=0 then
    chan.inst=inst
   end
   chan.iframe=0
   chan.nfreq=note_freqs[note_num]
  end
 end
 row_num=row_num+1
 if row_num==64 then
  position_num=(position_num+1)%(#positions)
  fetch_position()
 end
end

function music_frame()
 if row_frame==0 then
  read_row()
 end
 row_frame=(row_frame+1)%song_speed
 for c=0,3 do
  chan=chan_states[c]
  if chan.inst~=0 then
   instruments[chan.inst](c,15,chan.nfreq,chan.iframe)
   chan.iframe=chan.iframe+1
  end
 end
end

function TIC()
 cls()
 music_frame()
end
`;

export class Song extends Model([
    new fields.ListField(
        'instruments',
        new fields.ModelField('instrument', Wave),
        {startIndex: 1, length: INSTRUMENT_COUNT},
    ),
    new fields.ListField(
        'patterns',
        new fields.ModelField('pattern', Pattern),
        {startIndex: 0, length: PATTERN_COUNT},
    ),
    new fields.ListField(
        'positions',
        new fields.IntegerField('pattern', {default: 0, min: 0, max: PATTERN_COUNT - 1}),
        {length: 256},
    ),
    new fields.IntegerField('speed', {default: 6, min: 1, max: 31}),
    new fields.IntegerField('length', {default: 1, min: 1, max: 256}),
]) {
    getLuaCode() {
        const positions = this.positions.slice(0, this.length);
        /* Remap pattern numbers so that we're only exporting the ones that
        appear in the positions list */
        const patternMap = {};
        const exportedPatterns = [];
        let nextLuaPatternNumber = 1;
        for (let i = 0; i < positions.length; i++) {
            const patternNumber = positions[i];
            if (patternMap[patternNumber] === undefined) {
                patternMap[patternNumber] = nextLuaPatternNumber;
                exportedPatterns.push(this.patterns[patternNumber]);
                nextLuaPatternNumber++;
            }
            positions[i] = patternMap[patternNumber];
        }
        const patternsData = exportedPatterns.map((pattern) => {
            return pattern.getLuaData();
        }).join(",\n");

        const instrumentsCode = (
            this.instruments.slice(1).map((instrument) => {
                return instrument.getLuaCode();
            }).join(",\n")
        );
        return `
instruments={
${instrumentsCode}
}
patterns={
${patternsData}
}
positions={${positions.join(',')}}
song_speed=${this.speed}

${PLAYER_CODE}
`
    }
};
