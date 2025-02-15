import { Model, fields } from 'catwalk';

export class Pattern extends Model([
    new fields.ListField(
        'rows',
        new fields.StructField('row', [
            new fields.IntegerField('note', {default: 0}),
        ]),
        {length: 64},
    ),
]) {
};
