import { Model, fields } from 'catwalk';
import { OCTAVE_COUNT, PATTERN_COUNT } from '../defs';

export class EditorState extends Model([
    new fields.IntegerField('octave', {default: Math.floor(OCTAVE_COUNT / 2), min: 1, max: OCTAVE_COUNT}),
    new fields.IntegerField('pattern', {default: 0, min: 0, max: PATTERN_COUNT - 1}),
    new fields.IntegerField('selectedPosition', {default: 0, min: 0, max: 255}),
]) {
};
