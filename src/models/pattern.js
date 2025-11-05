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
}

export class Pattern extends Model([
    new fields.ListField(
        'channels',
        new fields.ModelField('channel', Channel),
        {length: 4},
    ),
]) {
}
