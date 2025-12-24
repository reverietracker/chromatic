import { Model, fields } from 'catwalk';
import { NOTE_NUMS_BY_NAME, NOTES_BY_NUM } from '../defs';

class NoteField extends fields.IntegerField {
    serialize(val) {
        if (val === 0) {
            return "---";
        } else {
            return NOTES_BY_NUM[val].name;
        }
    }

    deserialize(val) {
        if (val == "---") {
            return 0;
        } else {
            return NOTE_NUMS_BY_NAME[val];
        }
    }
}

class RowField extends fields.StructField {
    constructor(name, options) {
        const childFields = [
            new NoteField('note', {default: 0}),
            new fields.IntegerField('instrument', {default: 0}),
        ];
        super(name, childFields, options);
    }

    serialize(obj) {
        const noteName = this.fieldLookup.note.serialize(obj.note);
        const instrument = obj.instrument.toString(16).toUpperCase();
        return `${noteName} ${instrument}`;
    }

    deserialize(rowString) {
        const noteName = rowString.substring(0,3);
        return {
            'note': this.fieldLookup.note.deserialize(noteName),
            'instrument': parseInt(rowString.substring(4,5), 16)
        };
    }
}

export class Channel extends Model([
    new fields.ListField(
        'rows',
        new RowField('row'),
        {length: 64},
    ),
]) {
    getLuaData(instrumentsMap, patternLength) {
        const rowData = this.rows.slice(0, patternLength).map((row) => {
            return `{${row.note},${row.instrument == 0 ? 0 : instrumentsMap[row.instrument]}}`;
        }).join(",");
        return `  {${rowData}}`;
    }
    usedInstruments(patternLength) {
        /* Return a Set of instrument numbers used in this channel */
        const instruments = new Set();
        for (const row of this.rows.slice(0, patternLength)) {
            if (row.instrument !== 0) {
                instruments.add(row.instrument);
            }
        }
        return instruments;
    }
    isEmpty() {
        for (const row of this.rows) {
            if (row.note !== 0 || row.instrument !== 0) {
                return false;
            }
        }
        return true;
    }
    toData() {
        if (this.isEmpty()) {
            return null;
        }
        return super.toData();
    }
    static fromData(data) {
        if (data === null) {
            return new this();
        }
        return super.fromData(data);
    }
}

export class Pattern extends Model([
    new fields.ListField(
        'channels',
        new fields.ModelField('channel', Channel),
        {length: 4},
    ),
    new fields.IntegerField('length', {default: 64, min: 1, max: 64}),
]) {
    getLuaData(instrumentsMap) {
        const channelsData = this.channels.map((channel) => {
            return channel.getLuaData(instrumentsMap, this.length);
        }).join(",\n");
        return ` {
${channelsData}
 }`;
    }
    usedInstruments() {
        /* Return a Set of instrument numbers used in this pattern */
        const instruments = new Set();
        for (const channel of this.channels) {
            for (const inst of channel.usedInstruments(this.length)) {
                instruments.add(inst);
            }
        }
        return instruments;
    }
    isEmpty() {
        for (const channel of this.channels) {
            if (!channel.isEmpty()) {
                return false;
            }
        }
        return true;
    }
    toData() {
        if (this.isEmpty()) {
            return null;
        }
        return super.toData();
    }
    static fromData(data) {
        if (data === null) {
            return new this();
        }
        return super.fromData(data);
    }
}