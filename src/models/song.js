import { Model, fields } from 'catwalk';

import { Wave } from "./instruments";
import { Pattern } from "./pattern";

const PATTERN_COUNT = 64;
const INSTRUMENT_COUNT = 15;

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
        new fields.IntegerField('pattern', {default: 1, min: 0, max: PATTERN_COUNT - 1}),
        {length: 256},
    ),
    new fields.IntegerField('speed', {default: 6, min: 1, max: 31}),
]) {
    getLuaCode() {
        return "{\n" + this.instruments.slice(1).map((instrument) => {
            return `${instrument.getLuaCode()},`;
        }).join("\n") + "\n}";
    }
};
