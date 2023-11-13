import { Model, fields } from 'catwalk';

import { Wave } from "./instruments";

export class Song extends Model([
    new fields.ListField(
        'instruments',
        new fields.ModelField('instrument', Wave),
        {startIndex: 1, length: 15}
    ),
]) {
    getLuaCode() {
        return "{\n" + this.instruments.map((instrument) => {
            return `${instrument.getLuaCode()},`;
        }).join("\n") + "\n}";
    }
};
