import { Model, fields } from 'catwalk';

export class Ornament extends Model([
    new fields.ListField(
        'pitches',
        new fields.IntegerField('pitch', {default: 0, min: -128, max: 127}),
        {length: 32},
    ),
]) {
    isEmpty() {
        for (const pitch of this.pitches) {
            if (pitch !== 0) {
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
