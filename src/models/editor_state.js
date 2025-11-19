import { Model, fields } from 'catwalk';
import { OCTAVE_COUNT } from '../defs';

export class EditorState extends Model([
    new fields.IntegerField('octave', {default: Math.floor(OCTAVE_COUNT / 2), min: 1, max: OCTAVE_COUNT}),
]) {
};
