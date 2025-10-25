import { Model, fields } from 'catwalk';

export class Channel extends Model([
    new fields.ListField(
        'rows',
        new fields.StructField('row', [
            new fields.IntegerField('note', {default: 0}),
            new fields.IntegerField('instrument', {default: 0}),
        ]),
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
