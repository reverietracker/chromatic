import { Model, fields } from 'catwalk';

import { Wave } from "./instruments";
import { Pattern } from "./pattern";

export class Song extends Model([
    new fields.ListField(
        'instruments',
        new fields.ModelField('instrument', Wave),
        {startIndex: 1, length: 15},
    ),
    new fields.ListField(
        'patterns',
        new fields.ModelField('pattern', Pattern),
        {startIndex: 0, length: 64},
    ),
    new fields.ListField(
        'positions',
        new fields.IntegerField('pattern', {default: 1}),
        {length: 256},
    ),
]) {
    getLuaCode() {
        return "{\n" + this.instruments.slice(1).map((instrument) => {
            return `${instrument.getLuaCode()},`;
        }).join("\n") + "\n}";
    }
};
